"use client";

// グローバルエラー境界
// 子コンポーネントでエラーが発生した際に、真っ白な画面を防ぎ
// ユーザーにリカバリー方法を提示する

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="w-full max-w-md text-center">
        <div className="text-5xl">😵</div>
        <h1 className="mt-4 text-2xl font-bold text-text-primary">
          エラーが発生しました
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          予期しないエラーが発生しました。
          <br />
          繰り返し発生する場合は、お問い合わせください。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button variant="primary" onClick={reset}>
            もう一度試す
          </Button>
          <a
            href="/"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            トップページに戻る
          </a>
        </div>
      </div>
    </main>
  );
}
