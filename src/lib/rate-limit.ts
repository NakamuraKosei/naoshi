// シンプルなインメモリ レートリミッター
// Vercel Serverless では各インスタンスごとにメモリが独立するため
// 厳密なグローバル制限にはならないが、単一インスタンス内での
// 大量リクエスト防止には十分に機能する。

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// key -> { count, resetAt }
const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期的に掃除（メモリリーク防止）
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

/**
 * レートリミットチェック
 * @param key - 識別子（IP or userId）
 * @param limit - ウィンドウ内の最大リクエスト数
 * @param windowMs - ウィンドウの長さ（ミリ秒）
 * @returns { allowed: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // 新規 or ウィンドウ期限切れ
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}
