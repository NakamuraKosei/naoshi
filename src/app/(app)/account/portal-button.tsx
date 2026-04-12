"use client";

// Stripe Customer Portal を開くためのクライアントコンポーネント
// design.md 9.2: 「プランを変更する」

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalButton({ hasCustomer }: { hasCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stripe Customer がまだ紐付いていない場合は /pricing へ誘導
  if (!hasCustomer) {
    return (
      <Button
        variant="primary"
        onClick={() => {
          window.location.href = "/pricing";
        }}
      >
        プランを選ぶ
      </Button>
    );
  }

  // Portal セッションを発行して遷移する
  const openPortal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Portal の起動に失敗しました。");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="primary" onClick={openPortal} disabled={loading}>
        {loading ? "読み込み中…" : "プランを変更する"}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
