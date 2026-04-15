"use client";

// (app) グループ専用のエラー境界
// ログイン済みユーザー向けページ（/app, /account, /history）でのエラーをキャッチ

import { useEffect } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="text-5xl">😵</div>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          エラーが発生しました
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          ページの読み込みに失敗しました。
          <br />
          繰り返し発生する場合は、お問い合��せください。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button variant="primary" onClick={reset}>
            もう一度試す
          </Button>
          <a
            href="/app"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            変換画面に戻る
          </a>
        </div>
      </main>
    </div>
  );
}
