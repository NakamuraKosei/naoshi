import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 変換エンジンのシステムプロンプト読み込みユーティリティ。
 *
 * カテゴリ（レポート / ビジネス）× 文字数（短文 / 長文）で
 * 対応するプロンプトを自動選択して返す。
 *
 * 重要:
 * - プロンプトはコード内にハードコードしない（AGENTS.md）
 * - サーバー専用。`import "server-only"` によりクライアントバンドルへの混入を防ぐ。
 */

// 文字数の長さ区分
export type TextLength = "short" | "long";

// カテゴリの型（レポート / ビジネス）
export type Category = "report" | "business";

// 短文判定の閾値（500字以下を短文とする）
export const SHORT_TEXT_THRESHOLD = 500;

// カテゴリ × 長さごとのファイル名マッピング
const PROMPT_FILES: Record<Category, Record<TextLength, string>> = {
  report: {
    short: "humanize-system-prompt-short-v4.1.md",
    long: "humanize-system-prompt-v4.1.md",
  },
  business: {
    short: "humanize-business-short-v1.1.md",
    long: "humanize-business-v1.1.md",
  },
};

// カテゴリごとのダブルチェック用リペアプロンプト
const REPAIR_PROMPT_FILES: Record<Category, string> = {
  report: "repair-prompt-v1.1.md",
  business: "repair-business-v1.1.md",
};

// マイ文体（文体プロファイル）関連のプロンプト
const STYLE_EXTRACT_FILE = "style-profile-extract-v1.0.md";
const STYLE_INJECT_FILE = "style-inject-v1.0.md";

// キャッシュ
const cachedPrompts: Record<string, string | null> = {};

/**
 * 入力文字数から長さ区分を判定する。
 */
export function detectTextLength(charCount: number): TextLength {
  return charCount <= SHORT_TEXT_THRESHOLD ? "short" : "long";
}

/**
 * カテゴリ × 長さ区分に応じたシステムプロンプト本文を取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadHumanizeSystemPrompt(
  textLength: TextLength = "long",
  category: Category = "report",
): Promise<string> {
  const cacheKey = `${category}:${textLength}`;
  if (cachedPrompts[cacheKey]) {
    return cachedPrompts[cacheKey]!;
  }

  const promptPath = path.join(
    process.cwd(),
    "prompts",
    PROMPT_FILES[category][textLength],
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompts[cacheKey] = content;
  return content;
}

/**
 * カテゴリに応じたダブルチェック用リペアプロンプトを取得する。
 * 初回呼び出し時のみファイルを読み、以降はキャッシュを返す。
 */
export async function loadRepairPrompt(
  category: Category = "report",
): Promise<string> {
  const cacheKey = `repair:${category}`;
  if (cachedPrompts[cacheKey]) {
    return cachedPrompts[cacheKey]!;
  }

  const promptPath = path.join(
    process.cwd(),
    "prompts",
    REPAIR_PROMPT_FILES[category],
  );

  const content = await readFile(promptPath, "utf8");
  cachedPrompts[cacheKey] = content;
  return content;
}

/**
 * 文体プロファイル抽出用のシステムプロンプトを取得する。
 * （マイ文体の登録時に、サンプル文から癖を解析するパスで使う）
 */
export async function loadStyleExtractPrompt(): Promise<string> {
  const cacheKey = "style:extract";
  if (cachedPrompts[cacheKey]) {
    return cachedPrompts[cacheKey]!;
  }
  const promptPath = path.join(process.cwd(), "prompts", STYLE_EXTRACT_FILE);
  const content = await readFile(promptPath, "utf8");
  cachedPrompts[cacheKey] = content;
  return content;
}

/**
 * マイ文体の注入テンプレートを取得し、{{STYLE_PROFILE}} を実際の
 * プロファイル（summary）に置換して返す。
 * 変換時、システムプロンプトの末尾に追記して使う。
 */
export async function loadStyleInjectAddon(
  profileSummary: string,
): Promise<string> {
  const cacheKey = "style:inject";
  if (!cachedPrompts[cacheKey]) {
    const promptPath = path.join(process.cwd(), "prompts", STYLE_INJECT_FILE);
    cachedPrompts[cacheKey] = await readFile(promptPath, "utf8");
  }
  return cachedPrompts[cacheKey]!.replace("{{STYLE_PROFILE}}", profileSummary);
}
