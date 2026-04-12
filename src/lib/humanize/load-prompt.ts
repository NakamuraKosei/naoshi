import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 変換エンジンのシステムプロンプト読み込みユーティリティ。
 *
 * `prompts/humanize-system-prompt.md` を真実の情報源として読み込み、
 * モジュールスコープでキャッシュする（ホットリロード時を除き一度だけI/O）。
 *
 * 重要:
 * - プロンプトはコード内にハードコードしない（AGENTS.md）
 * - サーバー専用。`import "server-only"` によりクライアントバンドルへの混入を防ぐ。
 */

// 読み込み結果のキャッシュ（モジュールスコープ）
let cachedPrompt: string | null = null;

/**
 * システムプロンプトの本文を取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadHumanizeSystemPrompt(): Promise<string> {
  if (cachedPrompt !== null) {
    return cachedPrompt;
  }

  // process.cwd() はNext.jsのプロジェクトルート（=naoshi/）を指す
  const promptPath = path.join(
    process.cwd(),
    "prompts",
    "humanize-system-prompt.md",
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompt = content;
  return content;
}
