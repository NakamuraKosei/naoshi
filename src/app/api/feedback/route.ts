import { createClient } from "@/lib/supabase/server";

/**
 * /api/feedback
 * -------------------------------------------------
 * ユーザーからのフィードバック（コメント）を保存するAPIルート。
 *
 * リクエスト:
 *   POST { comment: string }
 *
 * レスポンス:
 *   200 { success: true }
 *   400 { error: string } -- バリデーションエラー
 *   401 { error: string } -- 未ログイン
 *   500 { error: string } -- サーバーエラー
 */

export const runtime = "nodejs";

// コメントの最大文字数
const MAX_COMMENT_LENGTH = 1000;

export async function POST(request: Request) {
  // --- 1. リクエストボディのパース ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).comment !== "string"
  ) {
    return Response.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 },
    );
  }

  const comment = ((body as Record<string, unknown>).comment as string).trim();
  if (comment.length === 0) {
    return Response.json(
      { error: "コメントを入力してください。" },
      { status: 400 },
    );
  }
  if (comment.length > MAX_COMMENT_LENGTH) {
    return Response.json(
      { error: `コメントは${MAX_COMMENT_LENGTH}字以内でお願いします。` },
      { status: 400 },
    );
  }

  // --- 2. 認証チェック ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  }

  // --- 3. feedback テーブルに INSERT ---
  try {
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      comment,
    });

    if (error) {
      console.error("[feedback] insert error:", error.message);
      return Response.json(
        { error: "送信に失敗しました。もう一度お試しください。" },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(
      "[feedback] unexpected error:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json(
      { error: "送信に失敗しました。もう一度お試しください。" },
      { status: 500 },
    );
  }
}
