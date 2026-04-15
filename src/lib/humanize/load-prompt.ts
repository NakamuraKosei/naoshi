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

// 文字数の長さ区分
export type TextLength = "short" | "long";

// 短文判定の閾値（500字以下を短文とする）
export const SHORT_TEXT_THRESHOLD = 500;

// モード × 長さごとのファイル名マッピング
const PROMPT_FILES: Record<`${TextLength}-${HumanizeMode}`, string> = {
  "short-standard": "humanize-system-prompt-short-standard.md",
  "short-evasion": "humanize-system-prompt-short-evasion.md",
  "long-standard": "humanize-system-prompt-standard.md",
  "long-evasion": "humanize-system-prompt-evasion.md",
};

// キャッシュ
const cachedPrompts: Record<string, string | null> = {};

/**
 * 入力文字数から長さ区分を判定する。
 */
export function detectTextLength(charCount: number): TextLength {
  return charCount <= SHORT_TEXT_THRESHOLD ? "short" : "long";
}

/**
 * 指定モード・長さ区分のシステムプロンプト本文を取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadHumanizeSystemPrompt(
  mode: HumanizeMode = "standard",
  textLength: TextLength = "long",
): Promise<string> {
  const key = `${textLength}-${mode}`;

  if (cachedPrompts[key]) {
    return cachedPrompts[key]!;
  }

  // process.cwd() はNext.jsのプロジェクトルート（=naoshi/）を指す
  const promptPath = path.join(
    process.cwd(),
    "prompts",
    PROMPT_FILES[key as keyof typeof PROMPT_FILES],
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompts[key] = content;
  return content;
}
