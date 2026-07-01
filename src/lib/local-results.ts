"use client";

// 変換結果のローカル履歴（ブラウザのlocalStorage内にのみ保存）
// -------------------------------------------------
// プライバシー方針: 本文はサーバーに一切保存せず、この端末（ブラウザ）内にのみ保存する。
// アプリ版（naoshi-app/src/lib/local-results.ts）と同じ設計:
//   - 最新 MAX_RESULTS 件だけ保持し、古いものから自動削除
//   - ログアウト・アカウント削除時は全削除（共用PC対策として重要）

const STORAGE_KEY = "naoshi_local_results";

// 保持する最大件数（テキストのみなので容量は数十KB程度に収まる）
const MAX_RESULTS = 10;

export type LocalResult = {
  id: string;
  // 保存日時（ISO文字列）
  savedAt: string;
  // 変換結果の本文
  output: string;
  // 変換時の設定
  category: "report" | "business";
  style: "dearu" | "desumasu";
  mode: "standard" | "double_check";
  // 入力文字数（メタ情報として表示に使う）
  inputChars: number;
};

// 保存済みの結果一覧を読み込む（新しい順）。壊れていたら空扱い
export function loadLocalResults(): LocalResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalResult[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 結果を1件追加保存（先頭に追加し、上限を超えた古い分は捨てる）
export function saveLocalResult(
  entry: Omit<LocalResult, "id" | "savedAt">,
): void {
  try {
    const item: LocalResult = {
      ...entry,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
    };
    const next = [item, ...loadLocalResults()].slice(0, MAX_RESULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 保存失敗（容量超過・プライベートモード等）は致命的でないため無視
  }
}

// 1件削除
export function removeLocalResult(id: string): void {
  try {
    const next = loadLocalResults().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 無視
  }
}

// 全削除（ログアウト・アカウント削除時に必ず呼ぶ）
export function clearLocalResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無視
  }
}
