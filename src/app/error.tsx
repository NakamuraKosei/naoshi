"use client";

// グローバルエラー境界
// 子コンポーネントでエラーが発生した際に、真っ白な画面を防ぎ
// ユーザーにリカバリー方法を提示する

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをコンソールに記録（本番ではエラー監視サービスに送信可能）
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        {/* SiteHeaderが無いページのため、ブランドロゴを上部に置く */}
        <div className="mb-7">
          <Logo size="sm" />
        </div>
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
          予期しないエラーが発生しました。
          <br />
          お手数ですが、もう一度お試しください。
        </p>
        <div className="mt-7 flex flex-col items-center gap-3.5">
          <Button variant="primary" onClick={reset}>
            もう一度試す
          </Button>
          <Link
            href="/"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            トップページに戻る
          </Link>
        </div>
        <p className="mt-7 text-xs text-text-muted">
          繰り返し発生する場合はお問い合わせください
        </p>
      </div>
    </main>
  );
}
