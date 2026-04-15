"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

type LimitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  limitType: "count" | "chars";
};

/**
 * 利用上限モーダル
 * 月間の利用回数または文字数の上限に達した際に表示し、
 * プランアップグレードへ誘導する
 */
export function LimitModal({ isOpen, onClose, limitType }: LimitModalProps) {
  // フォーカストラップ（Tabキー循環 + Escapeで閉じる）
  const trapRef = useFocusTrap(isOpen, onClose);

  if (!isOpen) return null;

  const message =
    limitType === "count"
      ? "今月の利用回数に達しました。"
      : "今月の利用文字数に達しました。";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="利用上限"
        className="w-full max-w-[500px] rounded-xl bg-surface p-10 shadow-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-text-primary">
          今月の利用上限に達しました
        </h2>
        <p className="mt-4 text-base leading-[1.75] text-text-secondary">
          {message}
          プランをアップグレードすると引き続きご利用いただけます。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/pricing" className="flex-1">
            <Button variant="primary" className="w-full">
              プランを変更する
            </Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
