import Anthropic from "@anthropic-ai/sdk";
import { loadStyleExtractPrompt } from "@/lib/humanize/load-prompt";
import { checkLimit } from "@/lib/usage/check-limit";
import { rateLimit } from "@/lib/rate-limit";
import { createClientFromRequest } from "@/lib/supabase/bearer";

/**
 * /api/style-profile
 * -------------------------------------------------
 * マイ文体（文体プロファイル）のAPIルート。ヘビープラン限定。
 *
 *   POST   { text: string } … サンプル文を解析してプロファイルを登録（上書き）
 *   GET                     … 登録状況の取得
 *   DELETE                  … プロファイルの削除
 *
 * プライバシー:
 *   アップロードされた本文はDBに保存しない。解析後に破棄し、
 *   抽象化したプロファイル（summary/features）のみ保存する。
 *   本文はログにも残さない（requirements 4.2 と同方針）。
 */

export const runtime = "nodejs";

// 解析には多少時間がかかる（数十秒）ため余裕を持たせる
export const maxDuration = 120;

// サンプル文の最低文字数（これ未満は癖が安定して読めない）
const MIN_SAMPLE_CHARS = 1000;

// 解析に使う最大文字数（これ以降は切り捨て、解析コストを一定にする）
const ANALYZE_CAP_CHARS = 8000;

// 登録は1日3回まで（解析APIコストの保険。JST日付で判定）
const DAILY_REG_LIMIT = 3;

// 解析に使うモデル（文体抽出はSonnetで十分）
const ANALYZE_MODEL_ID = "claude-sonnet-4-6";

// 解析出力の最大トークン数（JSONのみなので小さくてよい）
const ANALYZE_MAX_TOKENS = 2000;

// プロファイルの型
type StyleProfile = {
  summary: string;
  features: string[];
};

/** JSTの今日の日付（YYYY-MM-DD）を返す */
function todayJst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** モデル出力からJSONを取り出す（コードフェンス除去＋前後のゴミ許容） */
function parseProfileJson(raw: string): StyleProfile | null {
  const cleaned = raw
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  // 最初の { から最後の } までを対象にする（前置きが混ざった場合の保険）
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    if (typeof parsed.summary !== "string" || parsed.summary.trim().length === 0) return null;
    if (!Array.isArray(parsed.features)) return null;
    const features = parsed.features
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
      .map((f) => f.trim())
      .slice(0, 10);
    // summaryが異常に長い場合は切り詰める（プロンプト肥大の保険）
    return { summary: parsed.summary.trim().slice(0, 1500), features };
  } catch {
    return null;
  }
}

/** 認証＋ヘビープラン検証の共通処理 */
async function authorizeHeavy(request: Request) {
  const auth = await createClientFromRequest(request);
  if (!auth.userId) {
    return { error: Response.json({ error: "ログインが必要です。" }, { status: 401 }) };
  }
  // ヘビープラン判定（canDoubleCheck と同一集合＝heavy_monthly / heavy_yearly）
  const limit = await checkLimit(auth.userId, auth.supabase);
  if (!limit.canDoubleCheck) {
    return {
      error: Response.json(
        { error: "マイ文体はヘビープランでのみ利用できます。" },
        { status: 403 },
      ),
    };
  }
  return { supabase: auth.supabase, userId: auth.userId };
}

// --- 登録状況の取得 ---
export async function GET(request: Request) {
  const auth = await authorizeHeavy(request);
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("user_style_profiles")
    .select("profile, sample_chars, updated_at")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    console.error("[style-profile] select error:", error.message);
    return Response.json({ error: "取得に失敗しました。" }, { status: 500 });
  }

  if (!data) {
    return Response.json({ registered: false });
  }
  const profile = data.profile as StyleProfile;
  return Response.json({
    registered: true,
    features: profile.features ?? [],
    sampleChars: data.sample_chars,
    updatedAt: data.updated_at,
  });
}

// --- サンプル文の解析＆登録 ---
export async function POST(request: Request) {
  // IP単位のレートリミット（解析は重い処理のため絞る）
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`style-profile:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "リクエストが多すぎます。しばらくお待ちください。" },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[style-profile] ANTHROPIC_API_KEY is not set");
    return Response.json({ error: "サーバー設定に問題があります。" }, { status: 500 });
  }

  // ボディのパース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).text !== "string"
  ) {
    return Response.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const text = ((body as Record<string, unknown>).text as string).trim();
  if (text.length < MIN_SAMPLE_CHARS) {
    return Response.json(
      { error: `サンプルは${MIN_SAMPLE_CHARS.toLocaleString()}字以上入力してください。` },
      { status: 400 },
    );
  }

  const auth = await authorizeHeavy(request);
  if ("error" in auth) return auth.error;

  // --- 日次登録制限のチェック（1日3回まで） ---
  const { data: existing } = await auth.supabase
    .from("user_style_profiles")
    .select("daily_regs, last_reg_date")
    .eq("user_id", auth.userId)
    .maybeSingle();

  const today = todayJst();
  const isSameDay = existing?.last_reg_date === today;
  const usedToday = isSameDay ? (existing?.daily_regs ?? 0) : 0;
  if (usedToday >= DAILY_REG_LIMIT) {
    return Response.json(
      { error: `文体の登録は1日${DAILY_REG_LIMIT}回までです。明日またお試しください。` },
      { status: 429 },
    );
  }

  // --- 解析パス（Claude）---
  // 解析対象は先頭 ANALYZE_CAP_CHARS 字まで（コストを一定化）
  const sample = text.slice(0, ANALYZE_CAP_CHARS);
  let profile: StyleProfile | null = null;
  try {
    const systemPrompt = await loadStyleExtractPrompt();
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: ANALYZE_MODEL_ID,
      max_tokens: ANALYZE_MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: sample }],
    });
    const raw = message.content
      .filter(
        (block): block is Extract<typeof block, { type: "text" }> =>
          block.type === "text",
      )
      .map((block) => block.text)
      .join("");
    profile = parseProfileJson(raw);
  } catch (err) {
    // 本文はログに残さない
    console.error(
      "[style-profile] analyze error:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json(
      { error: "解析に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }

  if (!profile) {
    console.error("[style-profile] failed to parse profile json");
    return Response.json(
      { error: "解析に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }

  // --- 保存（本文は保存しない。プロファイルのみupsert） ---
  const { error: upsertError } = await auth.supabase
    .from("user_style_profiles")
    .upsert(
      {
        user_id: auth.userId,
        profile,
        sample_chars: text.length,
        daily_regs: usedToday + 1,
        last_reg_date: today,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error("[style-profile] upsert error:", upsertError.message);
    return Response.json({ error: "保存に失敗しました。" }, { status: 500 });
  }

  return Response.json({
    registered: true,
    features: profile.features,
    sampleChars: text.length,
  });
}

// --- プロファイルの削除 ---
export async function DELETE(request: Request) {
  const auth = await authorizeHeavy(request);
  if ("error" in auth) return auth.error;

  const { error } = await auth.supabase
    .from("user_style_profiles")
    .delete()
    .eq("user_id", auth.userId);

  if (error) {
    console.error("[style-profile] delete error:", error.message);
    return Response.json({ error: "削除に失敗しました。" }, { status: 500 });
  }
  return Response.json({ success: true });
}
