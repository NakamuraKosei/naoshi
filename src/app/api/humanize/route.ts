import Anthropic from "@anthropic-ai/sdk";
import { loadHumanizeSystemPrompt, type HumanizeMode } from "@/lib/humanize/load-prompt";
import { checkLimit } from "@/lib/usage/check-limit";
import { recordUsage } from "@/lib/usage/record-usage";
import { rateLimit } from "@/lib/rate-limit";

/**
 * /api/humanize
 * -------------------------------------------------
 * 変換エンジンのAPIルート（Next.js 16 App Router / Route Handler）。
 *
 * リクエスト:
 *   POST { text: string, style: "dearu" | "desumasu", mode?: "standard" | "evasion" }
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

// 出力の最大トークン数（10,000字の書き換えにも対応できる余裕）
const MAX_OUTPUT_TOKENS = 16000;

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
 * mode は省略可（デフォルト: "standard"）。
 */
function isValidBody(
  body: unknown,
): body is { text: string; style: Style; mode?: HumanizeMode } {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;
  if (typeof record.text !== "string") return false;
  if (record.style !== "dearu" && record.style !== "desumasu") return false;
  // mode は省略可。指定時は "standard" | "evasion" のみ許容
  if (record.mode !== undefined && record.mode !== "standard" && record.mode !== "evasion") {
    return false;
  }
  return true;
}

// モックモードフラグ: MOCK_HUMANIZE=1 でAnthropic呼び出しを回避
// Anthropic キー取得前のフロー確認用。本番では必ず OFF にする。
const IS_MOCK = process.env.MOCK_HUMANIZE === "1";

/**
 * Claude APIの出力からJSON構造を抽出する。
 * JSONパースに失敗した場合はテキスト全体を converted_text として扱う（フォールバック）。
 */
function parseStructuredOutput(raw: string): {
  convertedText: string;
  modificationPoints: string[];
} {
  try {
    // ```json ... ``` で囲まれている場合を考慮
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] ?? jsonMatch[0];
      const parsed = JSON.parse(jsonStr) as {
        converted_text?: string;
        modification_points?: string[];
      };
      if (parsed.converted_text) {
        return {
          convertedText: parsed.converted_text.trim(),
          modificationPoints: Array.isArray(parsed.modification_points)
            ? parsed.modification_points
            : [],
        };
      }
    }
  } catch {
    // JSONパース失敗 → フォールバック
  }
  // フォールバック: テキスト全体を変換結果として扱い、修正ポイントは空
  return { convertedText: raw, modificationPoints: [] };
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
      // モード判定（省略時は "standard"）
      const mode: HumanizeMode = body.mode ?? "standard";
      const basePrompt = await loadHumanizeSystemPrompt(mode);
      // 文体指定を末尾に1行追加
      systemPrompt = `${basePrompt}\n\n---\n\n文体指定: ${styleLabel(body.style)}\n\n---\n\n## 出力フォーマット\n\n以下のJSON形式で出力してください。JSONのみを出力し、他のテキストは含めないでください。\n\n\`\`\`json\n{\n  "converted_text": "変換後の本文をここに記述",\n  "modification_points": [\n    "修正ポイント1",\n    "修正ポイント2",\n    "修正ポイント3"\n  ]\n}\n\`\`\`\n\n- converted_text: 変換後の本文（従来通りのルールで書き換えた全文）\n- modification_points: 今回の書き換えで行った修正の要約を3〜5個、箇条書きで記述。具体的にどの表現をどう変えたかがわかるように書くこと。`;
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
      const rawOutput = message.content
        .filter(
          (block): block is Extract<typeof block, { type: "text" }> =>
            block.type === "text",
        )
        .map((block) => block.text)
        .join("")
        .trim();

      // JSON形式のレスポンスをパース
      const parsed = parseStructuredOutput(rawOutput);
      output = parsed.convertedText;
      modificationPoints = parsed.modificationPoints;
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
    try {
      await recordUsage({
        inputChars: text.length,
        outputChars: output.length,
        style: body.style,
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
