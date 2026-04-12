import Anthropic from "@anthropic-ai/sdk";
import { loadHumanizeSystemPrompt } from "@/lib/humanize/load-prompt";
import { checkLimit } from "@/lib/usage/check-limit";
import { recordUsage } from "@/lib/usage/record-usage";

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

// Claude モデルID（requirements記載の Sonnet 4）
const MODEL_ID = "claude-sonnet-4-20250514";

// 出力の最大トークン数（3000字の書き換えでも十分な余裕）
const MAX_OUTPUT_TOKENS = 6000;

// 文体の型
type Style = "dearu" | "desumasu";

/**
 * 文体指定の人間可読な日本語ラベル。
 * システムプロンプトの末尾に「文体指定: 〜」を付与するために使う。
 */
function styleLabel(style: Style): string {
  return style === "dearu" ? "だ・である調" : "ですます調";
}

/**
 * リクエストボディの型ガード。
 */
function isValidBody(
  body: unknown,
): body is { text: string; style: Style } {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  if (typeof record.text !== "string") return false;
  if (record.style !== "dearu" && record.style !== "desumasu") return false;
  return true;
}

// モックモードフラグ: MOCK_HUMANIZE=1 でAnthropic呼び出しを回避
// Anthropic キー取得前のフロー確認用。本番では必ず OFF にする。
const IS_MOCK = process.env.MOCK_HUMANIZE === "1";

export async function POST(request: Request) {
  const startedAt = Date.now();

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

  // --- 3. 入力バリデーション（空文字チェック） ---
  const text = body.text.trim();
  if (text.length === 0) {
    return Response.json(
      { error: "テキストを入力してください。" },
      { status: 400 },
    );
  }

  // --- 3.1 認証 & 利用制限チェック（プラン別の回数/文字数） ---
  const limit = await checkLimit();
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
  if (text.length > limit.maxChars) {
    return Response.json(
      {
        error: `このプランでは最大${limit.maxChars}字までです。プランを変更しますか？`,
        limit,
      },
      { status: 400 },
    );
  }

  // --- 4. システムプロンプトをファイルから読み込む ---
  //     （プロンプトはコード内にハードコードしない、モック時はスキップ）
  let systemPrompt: string;
  if (!IS_MOCK) {
    try {
      const basePrompt = await loadHumanizeSystemPrompt();
      // 文体指定を末尾に1行追加
      systemPrompt = `${basePrompt}\n\n---\n\n文体指定: ${styleLabel(body.style)}`;
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

    if (IS_MOCK) {
      // ダミー応答: 入力テキストに接頭辞を付けて返すだけ
      // フロー確認用のため、実際の変換は行わない
      await new Promise((r) => setTimeout(r, 600));
      output = `【モック変換・${styleLabel(body.style)}】\n\n${text}\n\n（※ MOCK_HUMANIZE=1 のため実際の変換は行っていません）`;
    } else {
      const client = new Anthropic({ apiKey: apiKey! });
      const message = await client.messages.create({
        model: MODEL_ID,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });

      // レスポンスからテキストブロックのみを連結
      output = message.content
        .filter(
          (block): block is Extract<typeof block, { type: "text" }> =>
            block.type === "text",
        )
        .map((block) => block.text)
        .join("")
        .trim();
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
    //     （入力テキスト本文は保存しない、プライバシー保護）
    try {
      await recordUsage({
        inputChars: text.length,
        outputChars: output.length,
        style: body.style,
        durationMs,
      });
    } catch (err) {
      // 記録失敗は変換結果の返却を止めない
      console.error(
        "[humanize] failed to record usage:",
        err instanceof Error ? err.message : "unknown",
      );
    }

    return Response.json({ output, durationMs });
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
