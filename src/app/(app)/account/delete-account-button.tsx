"use client";

// アカウント削除（退会）ボタン + 確認モーダル
// App Store ガイドライン 5.1.1(v) 対応: アプリからの案内先となる削除導線。
// 削除すると有効なサブスクリプションも即時解約される（/api/account/delete 側で処理）。

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearLocalResults } from "@/lib/local-results";

// 誤操作防止のため、この文字列の入力を必須にする
const CONFIRM_WORD = "削除";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(data.error ?? "削除に失敗しました。お問い合わせください。");
        setDeleting(false);
        return;
      }
      // 削除完了。この端末に保存した変換結果も消してからトップへ戻す
      clearLocalResults();
      window.location.href = "/?deleted=1";
    } catch {
      setErrorMessage("通信に失敗しました。接続を確認してください。");
      setDeleting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        アカウントを削除する
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-[500px] rounded-xl bg-white p-8 shadow-lg sm:p-10">
            <h2 id="delete-account-title" className="text-xl font-bold text-text-primary">
              アカウントを削除しますか？
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-text-secondary">
              <li>・ご契約中のプランがある場合、<span className="font-semibold text-[#EF4444]">即時解約</span>されます（日割りの返金はありません）</li>
              <li>・利用履歴などのデータはすべて完全に削除されます</li>
              <li>・この操作は<span className="font-semibold text-[#EF4444]">取り消せません</span></li>
            </ul>

            <label className="mt-6 block text-sm text-text-secondary">
              確認のため「{CONFIRM_WORD}」と入力してください
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-base text-text-primary focus:border-primary focus:outline-none"
                disabled={deleting}
              />
            </label>

            {errorMessage && (
              <p className="mt-3 text-sm text-[#EF4444]">{errorMessage}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpen(false);
                  setConfirmText("");
                  setErrorMessage(null);
                }}
                disabled={deleting}
              >
                キャンセル
              </Button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== CONFIRM_WORD || deleting}
                className="rounded-[10px] bg-[#EF4444] px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-[#DC2626] disabled:cursor-not-allowed disabled:bg-text-muted"
              >
                {deleting ? "削除しています…" : "完全に削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
