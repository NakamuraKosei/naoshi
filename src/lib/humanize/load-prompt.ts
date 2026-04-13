import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 変換エンジンのシステムプロンプト読み込みユーティリティ。
 *
 * 2モード対応:
 *   - standard: `prompts/humanize-system-prompt-standard.md`（品質重視）
 *   - evasion:  `prompts/humanize-system-prompt-evasion.md`（検出回避）
 *
 * 各モードのプロンプトをモジュールスコープでキャッシュする。
 *
 * 重要:
 * - プロンプトはコード内にハードコードしない（AGENTS.md）
 * - サーバー専用。`import "server-only"` によりクライアントバンドルへの混入を防ぐ。
 */

// モード型定義
export type HumanizeMode = "standard" | "evasion";

// モードごとのファイル名マッピング
const PROMPT_FILES: Record<HumanizeMode, string> = {
  standard: "humanize-system-prompt-standard.md",
  evasion: "humanize-system-prompt-evasion.md",
};

// モードごとのキャッシュ
const cachedPrompts: Record<HumanizeMode, string | null> = {
  standard: null,
  evasion: null,
};

/**
 * 指定モードのシステムプロンプト本文を取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadHumanizeSystemPrompt(
  mode: HumanizeMode = "standard",
): Promise<string> {
  if (cachedPrompts[mode] !== null) {
    return cachedPrompts[mode]!;
  }

  // process.cwd() はNext.jsのプロジェクトルート（=naoshi/）を指す
  const promptPath = path.join(
    process.cwd(),
    "prompts",
    PROMPT_FILES[mode],
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompts[mode] = content;
  return content;
}
