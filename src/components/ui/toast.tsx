"use client";

// 共通トースト通知
// -------------------------------------------------
// 画面下部中央に短時間だけ表示される通知。コピー完了・保存完了などの
// 軽いフィードバックに使う。ページごとに useToast() で使い回す。
//
// 使い方:
//   const { toast, showToast } = useToast();
//   showToast("コピーしました");
//   return <>{...}<Toast toast={toast} /></>;

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ToastState = {
  message: string;
  // success: 緑チェック / error: 赤 / info: 黒
  variant: "success" | "error" | "info";
  // 再表示時にアニメを再生するためのキー
  key: number;
} | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" | "info" = "success") => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, variant, key: Date.now() });
      timerRef.current = setTimeout(() => setToast(null), 2500);
    },
    [],
  );

  // アンマウント時にタイマーを掃除
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      key={toast.key}
      role="status"
      aria-live="polite"
      // モバイルは画面下部の固定ボタンバー（/app）と重ならないよう高めに出す
      className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 [animation:modal-in_0.2s_ease-out] md:bottom-8"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-lg",
          toast.variant === "success" && "bg-[#10B981]",
          toast.variant === "error" && "bg-[#EF4444]",
          toast.variant === "info" && "bg-surface-dark",
        )}
      >
        {toast.variant === "success" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-none" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {toast.message}
      </div>
    </div>
  );
}
