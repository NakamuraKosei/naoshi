import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 変換エンジンのシステムプロンプト読み込みユーティリティ。
 *
 * 文字数で短文/長文を自動判定し、対応するプロンプトを返す。
 * モードは回避モード一本化（v1.1）。
 *
 * 重要:
 * - プロンプトはコード内にハードコードしない（AGENTS.md）
 * - サーバー専用。`import "server-only"` によりクライアントバンドルへの混入を防ぐ。
 */

// 文字数の長さ区分
export type TextLength = "short" | "long";

// 短文判定の閾値（500字以下を短文とする）
export const SHORT_TEXT_THRESHOLD = 500;

// 長さごとのファイル名マッピング（回避モード一本化）
const PROMPT_FILES: Record<TextLength, string> = {
  short: "humanize-system-prompt-short-evasion.md",
  long: "humanize-system-prompt-evasion.md",
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
 * 長さ区分に応じたシステムプロンプト本文を取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadHumanizeSystemPrompt(
  textLength: TextLength = "long",
): Promise<string> {
  if (cachedPrompts[textLength]) {
    return cachedPrompts[textLength]!;
  }

  const promptPath = path.join(
    process.cwd(),
    "prompts",
    PROMPT_FILES[textLength],
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompts[textLength] = content;
  return content;
}
