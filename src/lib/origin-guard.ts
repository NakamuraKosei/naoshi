// CSRF対策: ブラウザからのクロスサイトPOSTを拒否するガード
// - Origin ヘッダーが無い場合は通過（ネイティブアプリ・サーバー間通信は Origin を送らない）
// - Origin がある場合は、自サイト（リクエスト先と同一ホスト）または本番ドメインのみ許可
// Supabase Cookie は SameSite=Lax だが、暗黙の防御に依存しないための明示的なチェック。

const ALLOWED_HOSTS = ["naoshiai.com", "www.naoshiai.com", "localhost", "127.0.0.1"];

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originHost = new URL(origin).hostname;
    if (ALLOWED_HOSTS.includes(originHost)) return true;
    // Vercel プレビュー環境などは「リクエスト先ホストと同一」なら許可
    const requestHost = request.headers.get("host")?.split(":")[0];
    return originHost === requestHost;
  } catch {
    return false;
  }
}
