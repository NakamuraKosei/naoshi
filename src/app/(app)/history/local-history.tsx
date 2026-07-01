"use client";

// この端末に保存された変換結果の一覧（履歴ページ上部に表示）
// 本文はlocalStorageにのみ存在し、サーバーには保存されていない。
// 表示・コピー・1件削除・全削除ができる。

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  loadLocalResults,
  removeLocalResult,
  clearLocalResults,
  type LocalResult,
} from "@/lib/local-results";

// 日時をJSTの「YYYY/MM/DD HH:mm」に整形
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function LocalHistory() {
  // localStorageはサーバーで読めないため、マウント後に読み込む
  const [results, setResults] = useState<LocalResult[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // localStorageはサーバー描画時に存在しないため、ハイドレーション後の
    // 初回マウントで一度だけ読み込む（この同期setStateは意図的）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(loadLocalResults());
  }, []);

  // 読み込み前（SSR/初回描画）は何も出さない
  if (results === null) return null;

  async function handleCopy(r: LocalResult) {
    try {
      await navigator.clipboard.writeText(r.output);
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // コピー失敗は無視（権限なし等）
    }
  }

  function handleRemove(id: string) {
    removeLocalResult(id);
    setResults(loadLocalResults());
  }

  function handleClearAll() {
    if (!window.confirm("この端末に保存された変換結果をすべて削除しますか？")) return;
    clearLocalResults();
    setResults([]);
  }

  return (
    <section aria-label="この端末に保存された変換結果" className="mb-10">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-text-primary">変換結果（この端末のみ）</h2>
          <p className="mt-1 text-xs text-text-muted">
            結果はお使いの端末（ブラウザ）内にのみ保存され、サーバーには保存されません。
            最新10件・ログアウトすると消去されます。
          </p>
        </div>
        {results.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="shrink-0 text-xs text-text-muted underline-offset-2 hover:text-[#EF4444] hover:underline"
          >
            すべて削除
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-5 py-6 text-center text-sm text-text-secondary shadow-sm">
          この端末に保存された変換結果はまだありません。
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map((r) => {
            const isOpen = openId === r.id;
            return (
              <li key={r.id} className="rounded-lg border border-border bg-surface px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold text-text-primary">{formatDate(r.savedAt)}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                      {r.category === "report" ? "レポート" : "ビジネス"}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                      {r.style === "dearu" ? "だ・である調" : "です・ます調"}
                    </span>
                    {r.mode === "double_check" && (
                      <span className="rounded-full bg-primary-lighter px-2 py-0.5 text-xs font-medium text-primary">
                        ダブルチェック
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted tabular-nums">
                    入力 {r.inputChars.toLocaleString()} 字 → 出力 {r.output.length.toLocaleString()} 字
                  </span>
                </div>

                {/* 本文（閉じているときは2行プレビュー） */}
                <p
                  className={
                    isOpen
                      ? "mt-3 whitespace-pre-wrap text-sm leading-[1.8] text-text-primary"
                      : "mt-3 line-clamp-2 text-sm leading-[1.8] text-text-secondary"
                  }
                >
                  {r.output}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <Button variant="secondary" size="sm" onClick={() => setOpenId(isOpen ? null : r.id)}>
                    {isOpen ? "閉じる" : "全文を見る"}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleCopy(r)}>
                    コピー
                  </Button>
                  {copiedId === r.id && (
                    <span className="text-xs text-[#10B981]">コピーしました</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(r.id)}
                    className="ml-auto text-xs text-text-muted underline-offset-2 hover:text-[#EF4444] hover:underline"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
