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
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        {/* アイコン（絵文字ではなくSVG。文字化け・フォント依存を避ける） */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-lighter">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </div>
        <h1 className="mt-5 text-xl font-bold text-text-primary">
          エラーが発生しました
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
          ページの読み込みに失敗しました。
          <br />
          お手数ですが、もう一度お試しください。
        </p>
        <div className="mt-7 flex flex-col items-center gap-3.5">
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
        <p className="mt-7 text-xs text-text-muted">
          繰り返し発生する場合はお問い合わせください
        </p>
      </main>
    </div>
  );
}
