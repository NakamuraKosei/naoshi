"use client";

// 解約リンク（料金ページ下部に配置）
// Stripe Customer Portal を開いて解約手続きを行う

import { useState } from "react";

export function CancelLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) {
        // 未ログインの場合は何もしない
        setError("ログインが必要です。");
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "ページを開けませんでした。");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="text-sm text-text-muted underline transition-colors hover:text-text-secondary"
      >
        {loading ? "読み込み中…" : "解約をご希望の方はこちら"}
      </button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
