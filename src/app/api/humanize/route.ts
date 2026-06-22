import Anthropic from "@anthropic-ai/sdk";
import { loadHumanizeSystemPrompt, detectTextLength, type Category } from "@/lib/humanize/load-prompt";
import { checkLimit } from "@/lib/usage/check-limit";
import { recordUsage } from "@/lib/usage/record-usage";
import { rateLimit } from "@/lib/rate-limit";
import { createClientFromRequest } from "@/lib/supabase/bearer";

/**
 * /api/humanize
 * -------------------------------------------------
 * 変換エンジンのAPIルート（Next.js 16 App Router / Route Handler）。
 *
 * リクエスト:
 *   POST { text: string, style: "dearu" | "desumasu" }
 *
 * レスポンス:
 *   200 { output: string, durationMs: number }
 *   400 { error: string } -- 入力バリデーションエラー
 *   500 { error: string } -- サーバー/外部API/設定エラー
 *
 * プライバシー:
 *   requirements 4.2 に従い、入力テキストはログに残さない。
 *   エラーログにも本文（text）は含めない。
 *
 * 備考:
 *   - 認証/利用制限は checkLimit() で取得（プラン別の回数/文字数）
 *   - 変換成功時は recordUsage() で usage テーブルに1行記録（本文は保存しない）
 */

// Node.js ランタイムを明示（fs/promisesとAnthropic SDKのため）
export const runtime = "nodejs";

// 関数の最大実行時間（秒）。
// ダブルチェックは Opus で最大10,000字を1回変換するため、
// Vercelのデフォルト(60秒)では長文で時間切れになる恐れがある。
// 上限を5分に広げて途中打ち切りによる変換失敗を防ぐ（実課金は使った分のみ）。
export const maxDuration = 300;

// 変換に必要な最小入力文字数（これ未満は変換せず案内する）
const MIN_INPUT_CHARS = 10;

// Claude モデルID（Sonnet 4.6。指示追従の向上を狙い Sonnet 4 から更新）
const MODEL_ID = "claude-sonnet-4-6";

// ダブルチェック用の上位モデルID（Opus 4.7）。
// ダブルチェックは Copyleaks+repair をやめ、上位モデルで1回変換する方式に変更。
const DOUBLE_CHECK_MODEL_ID = "claude-opus-4-7";

// 出力の最大トークン数。
// Opus 4.7 は新トークナイザで最大35%ほどトークンが増えるため、
// 10,000字の和文を変換しても途中で切れないよう余裕を持たせる。
const MAX_OUTPUT_TOKENS = 24000;

// 文体の型
type Style = "dearu" | "desumasu";

// 変換モードの型
type Mode = "standard" | "double_check";

// カテゴリの型（レポート / ビジネス）はload-promptからインポート済み

/**
 * 文体指定の人間可読な日本語ラベル。
 * システムプロンプトの末尾に「文体指定: 〜」を付与するために使う。
 */
function styleLabel(style: Style): string {
  return style === "dearu" ? "だ・である調" : "です・ます調";
}

/**
 * リクエストボディの型ガード。
 */
function isValidBody(
  body: unknown,
): body is { text: string; style: Style; mode?: Mode; category?: Category } {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  if (typeof record.text !== "string") return false;
  if (record.style !== "dearu" && record.style !== "desumasu") return false;
  if (record.mode !== undefined && record.mode !== "standard" && record.mode !== "double_check") return false;
  if (record.category !== undefined && record.category !== "report" && record.category !== "business") return false;
  return true;
}

// モックモードフラグ: MOCK_HUMANIZE=1 でAnthropic呼び出しを回避
// Anthropic キー取得前のフロー確認用。本番では必ず OFF にする。
const IS_MOCK = process.env.MOCK_HUMANIZE === "1";

/**
 * Claude APIの出力からJSON構造を抽出する。
 * JSONパースに失敗した場合はテキスト全体を converted_text として扱う（フォールバック）。
 */
// 本文と修正ポイントを分ける区切り線。
// 本文は記号「=」を使わない規則（プロンプト1.4）のため、本文中にこの行が
// 現れることはなく、誤検知しない。
const OUTPUT_DELIMITER = "===修正ポイント===";

/**
 * プロンプト1.4で禁止している記号の混入をコード側で除去する保険。
 * モデルは概ね守るが、まれに混入するため機械的に掃除する。
 * - Markdown記法（見出し・太字）を除去
 * - 装飾記号（■◆●▼★☆※→⇒）を削除
 * - ダッシュ（——等）は挿入用法が多いため読点に置換し、連続読点を正規化
 */
function sanitizeForbiddenSymbols(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // Markdown見出し
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Markdown太字
    .replace(/[■◆●▼★☆※→⇒]/g, "") // 装飾記号
    .replace(/[—―–]+/g, "、") // ダッシュ類は読点へ
    .replace(/、{2,}/g, "、") // 連続読点を1つに
    .replace(/、([。、])/g, "$1"); // 「、。」等の崩れを正規化
}

/** 本文を囲む ``` コードフェンスが付いていたら除去する（保険）。 */
function stripCodeFence(text: string): string {
  return text
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

/**
 * モデル出力（本文 + 区切り線 + 修正ポイント）を分解する。
 * - 区切り線がある場合: 前を本文、後ろを修正ポイント（行ごとの箇条書き）として扱う。
 * - 区切り線が無い/形式が崩れた場合: 全体を本文として扱う（フォールバック）。
 * これによりJSONのような構文エラーで全体が失敗することがない。
 */
function parseStructuredOutput(raw: string): {
  convertedText: string;
  modificationPoints: string[];
} {
  const cleaned = raw.trim();
  const idx = cleaned.indexOf(OUTPUT_DELIMITER);

  if (idx === -1) {
    // 区切り線なし → 全体を本文として扱う
    return { convertedText: stripCodeFence(cleaned), modificationPoints: [] };
  }

  const body = stripCodeFence(cleaned.slice(0, idx).trim());
  const pointsBlock = cleaned.slice(idx + OUTPUT_DELIMITER.length);
  // 各行の先頭の箇条書き記号（・- * •）と空白を除去して配列化
  const modificationPoints = pointsBlock
    .split("\n")
    .map((line) => line.replace(/^[\s・\-*•]+/, "").trim())
    .filter((line) => line.length > 0);

  return { convertedText: body, modificationPoints };
}

export async function POST(request: Request) {
  const startedAt = Date.now();

  // --- 0. レートリミット（IP単位、1分あたり10リクエスト） ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`humanize:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  // --- 1. APIキーの事前チェック（モック時はスキップ） ---
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!IS_MOCK && !apiKey) {
    // 本文には機微情報を含めない
    console.error("[humanize] ANTHROPIC_API_KEY is not set");
    return Response.json(
      { error: "サーバー設定に問題があります。" },
      { status: 500 },
    );
  }

  // --- 2. リクエストボディのパース ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 },
    );
  }

  if (!isValidBody(body)) {
    return Response.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 },
    );
  }

  // --- 3. 入力バリデーション（空文字 / 短すぎチェック） ---
  // 数文字だけだと変換の意味がなく、無駄なAPI消費や不自然な出力を招くため
  // 最小文字数(MIN_INPUT_CHARS)未満は変換せず案内する。
  const text = body.text.trim();
  if (text.length === 0) {
    return Response.json(
      { error: "テキストを入力してください。" },
      { status: 400 },
    );
  }
  if (text.length < MIN_INPUT_CHARS) {
    return Response.json(
      { error: `もう少し長い文章を入力してください（${MIN_INPUT_CHARS}文字以上）。` },
      { status: 400 },
    );
  }

  // --- 3.1 認証 & 利用制限チェック（プラン別の回数/文字数） ---
  // Cookie（Web版）/ Bearer（モバイルアプリ）のどちらでも認証できる
  const auth = await createClientFromRequest(request);
  const limit = await checkLimit(auth.userId ?? undefined, auth.supabase);
  if (!limit.allowed) {
    if (limit.reason === "unauthenticated") {
      return Response.json(
        { error: "ログインが必要です。", limit },
        { status: 401 },
      );
    }
    return Response.json(
      { error: "今日の利用回数を超えました。明日またお使いいただけます。", limit },
      { status: 403 },
    );
  }
  // --- 3.2 ユーザーIDベースのレートリミット（IP偽装対策） ---
  // 変換は1回数十秒かかるため3回/分で実用上は十分。
  // 使用量の記録は変換完了後のため、並行リクエストで上限チェックを
  // すり抜けられる(TOCTOU)問題があり、その緩和策も兼ねて絞っている。
  if (limit.userId) {
    const userRl = rateLimit(`humanize:user:${limit.userId}`, 3, 60_000);
    if (!userRl.allowed) {
      return Response.json(
        { error: "リクエストが多すぎます。しばらくお待ちください。" },
        { status: 429 },
      );
    }
  }

  if (text.length > limit.maxChars) {
    return Response.json(
      {
        error: `このプランでは最大${limit.maxChars}字までです。プランを変更しますか？`,
        // userId は内部用なのでレスポンスから除外する
        limit: { ...limit, userId: undefined },
      },
      { status: 400 },
    );
  }

  // --- 3.3 カテゴリ・モードの取得 ---
  const category: Category = body.category ?? "report";
  const mode: Mode = body.mode ?? "standard";
  if (mode === "double_check" && !limit.canDoubleCheck) {
    return Response.json(
      { error: "ダブルチェックはヘビープランでのみ利用可能です。" },
      { status: 403 },
    );
  }

  // 文字数プランは今回の消費量が残量に収まるか事前確認する
  // （通常=入力字数×1、ダブルチェック=×3。従来はダブルチェックのみ
  //   チェックしており、通常モードは残量1字でも上限字数まで通せた）
  if (limit.limitType === "chars") {
    const charCost = mode === "double_check" ? text.length * 3 : text.length;
    if (charCost > limit.remaining) {
      return Response.json(
        {
          error:
            mode === "double_check"
              ? "ダブルチェックに必要な文字数が残量を超えています。通常モードをお試しください。"
              : `今期間の残り文字数（${limit.remaining.toLocaleString()}字）を超えています。文章を短くするか、リセットをお待ちください。`,
          // userId は内部用なのでレスポンスから除外する
          limit: { ...limit, userId: undefined },
        },
        { status: 403 },
      );
    }
  }

  // --- 4. システムプロンプトをファイルから読み込む ---
  //     （プロンプトはコード内にハードコードしない、モック時はスキップ）
  let systemPrompt: string;
  if (!IS_MOCK) {
    try {
      // カテゴリ × 文字数で短文/長文を自動切り替え
      const textLength = detectTextLength(text.length);
      const basePrompt = await loadHumanizeSystemPrompt(textLength, category);
      // 修正ポイントの個数指定（通常=2〜3個 / ダブルチェック=ちょうど3個）
      const pointsInstruction =
        mode === "double_check"
          ? "今回の書き換えで行った修正の要約をちょうど3個、箇条書きで記述する。"
          : "今回の書き換えで行った修正の要約を2〜3個、箇条書きで記述する。";
      // ダブルチェック（上位モデルOpus）専用の強化指示。
      // Opusは「上品に整える」傾向で構造を崩しきれないため、名指しで一段強く要求する。
      // 共通プロンプトはv4.1のまま使い、ここで追加ブロックだけを足す（別ファイルにはしない）。
      const doubleCheckAddon =
        mode === "double_check"
          ? `\n\n---\n\n## ダブルチェック追加指示（上位モデル向け・最優先）\n通常の変換よりもう一段踏み込むこと。\n- 段落の統合や順序の組み替えを積極的に行い、原文の設計図をより大きく崩す（事実・論点は保持）\n- 「1文だけの見出し段落」と否定形の強調（無視できない・見逃せない・小さくない等）を特に厳しく避ける\n- 章ごとの厚み（濃淡）を通常よりはっきりつける（最も詳しい段落と軽い段落の差を明確に）`
          : "";
      // 文体指定・ダブルチェック追加指示・出力フォーマットを末尾に追加
      systemPrompt = `${basePrompt}\n\n---\n\n文体指定: ${styleLabel(body.style)}${doubleCheckAddon}\n\n---\n\n## 出力フォーマット\n\n最初に変換後の本文だけを書く。本文をすべて書き終えたら、次の行に区切り線「${OUTPUT_DELIMITER}」を単独の行で出力し、その後に修正ポイントを1行に1個ずつ「・」で始めて箇条書きする。\n\n形式の例:\n（変換後の本文をそのまま記述）\n${OUTPUT_DELIMITER}\n・修正ポイント1\n・修正ポイント2\n\n厳守事項:\n- 本文部分には区切り線「${OUTPUT_DELIMITER}」やJSON・コードブロック記号（\`\`\`）を絶対に含めない。\n- 「本文:」などの前置きや見出しは付けず、いきなり本文から書き始める。\n- 修正ポイント: ${pointsInstruction}具体的にどの表現をどう変えたかがわかるように書く。`;
    } catch (err) {
      // 本文はログに残さない
      console.error(
        "[humanize] failed to load system prompt:",
        err instanceof Error ? err.message : "unknown",
      );
      return Response.json(
        { error: "サーバー設定に問題があります。" },
        { status: 500 },
      );
    }
  } else {
    systemPrompt = "";
  }

  // --- 5. Claude API 呼び出し（モック時はダミー応答） ---
  try {
    let output: string;

    // 修正ポイント
    let modificationPoints: string[] = [];

    if (IS_MOCK) {
      // ダミー応答
      await new Promise((r) => setTimeout(r, 600));
      output = `【モック変換・${styleLabel(body.style)}】\n\n${text}\n\n（※ MOCK_HUMANIZE=1 のため実際の変換は行っていません）`;
      modificationPoints = [
        "モックモードのため実際の変換は行っていません",
        "本番環境では MOCK_HUMANIZE を削除してください",
      ];
    } else {
      const client = new Anthropic({ apiKey: apiKey! });

      // ダブルチェックは上位モデル(Opus)で変換する。通常モードは Sonnet。
      const conversionModel =
        mode === "double_check" ? DOUBLE_CHECK_MODEL_ID : MODEL_ID;

      // 変換を1回実行する（リトライ時は追加指示を末尾に付与）。
      // ストリーミングで受信する。max_tokensが大きい場合、非ストリーミングだと
      // SDKが「10分を超える恐れ」として送信前に例外を投げるため、stream必須。
      // finalMessage() で全文を1つのMessageとして受け取り、以降は従来通り扱う。
      async function runConversion(extraInstruction?: string) {
        const stream = client.messages.stream({
          model: conversionModel,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: extraInstruction
            ? `${systemPrompt}\n\n---\n\n${extraInstruction}`
            : systemPrompt,
          messages: [
            {
              role: "user",
              content: text,
            },
          ],
        });
        const message = await stream.finalMessage();

        const rawOutput = message.content
          .filter(
            (block): block is Extract<typeof block, { type: "text" }> =>
              block.type === "text",
          )
          .map((block) => block.text)
          .join("")
          .trim();

        return parseStructuredOutput(rawOutput);
      }

      let parsed = await runConversion();

      // --- 文字数比ガード ---
      // プロンプトは出力字数の下限を指示するが、LLMは自分の出力字数を
      // 正確に数えられないため、コード側で検証して短すぎる場合のみ1回リトライする。
      // 下限はカテゴリのプロンプトに合わせる（レポート長文=90% / ビジネス長文=80%）。
      // 条件: 長文(500字超) かつ タイムアウト余裕がある場合のみ
      //       （Vercel Hobbyの60秒制限を考慮）
      const minRatio = category === "business" ? 0.8 : 0.9;
      const ratio = parsed.convertedText.length / text.length;
      const elapsedMs = Date.now() - startedAt;
      if (
        parsed.convertedText.length > 0 &&
        text.length > 500 &&
        ratio < minRatio &&
        elapsedMs < 25_000
      ) {
        console.warn(
          `[humanize] output too short (${Math.round(ratio * 100)}%), retrying once`,
        );
        const retried = await runConversion(
          `## 再変換指示（最優先）\n直前の変換結果は原文の約${Math.round(ratio * 100)}%の分量しかなく、短すぎて要件違反だった。今回は内容を一切削らず、原文の${Math.round(minRatio * 100)}〜120%の分量で全文を書き直すこと。`,
        );
        // 改善した場合のみ採用（悪化したら元の結果を使う）
        if (retried.convertedText.length > parsed.convertedText.length) {
          parsed = retried;
        }
      }

      // --- 禁止記号ガード ---
      // プロンプト1.4で禁止している記号の混入をコード側で除去する保険
      output = sanitizeForbiddenSymbols(parsed.convertedText);
      // 修正ポイントは最大3個に制限（通常=2〜3個 / ダブルチェック=3個）。
      // モデルが多めに返した場合のガードレール。
      modificationPoints = parsed.modificationPoints.slice(0, 3);

      // ダブルチェックは上位モデル(Opus)で変換済みなので、追加のリペア段階は行わない。
      // ※ Copyleaksスキャン + repair による方式はクレジット回復後に再検討する候補として保留。
    }

    if (output.length === 0) {
      console.error("[humanize] empty response from model");
      return Response.json(
        { error: "うまく変換できませんでした。もう一度お試しください。" },
        { status: 500 },
      );
    }

    const durationMs = Date.now() - startedAt;

    // --- 6. 使用実績を usage テーブルに記録 ---
    // ダブルチェック時は文字数を3倍で記録（上位モデル利用の消費コスト反映）
    const recordedChars = mode === "double_check" ? text.length * 3 : text.length;
    try {
      await recordUsage({
        client: auth.supabase,
        userId: limit.userId,
        inputChars: recordedChars,
        outputChars: output.length,
        style: body.style,
        mode,
        category,
        durationMs,
      });
    } catch (err) {
      console.error(
        "[humanize] failed to record usage:",
        err instanceof Error ? err.message : "unknown",
      );
    }

    return Response.json({ output, durationMs, modificationPoints });
  } catch (err) {
    // 本文（text）はログに出さない。エラー種別のみ。
    console.error(
      "[humanize] claude api error:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json(
      { error: "うまく変換できませんでした。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
