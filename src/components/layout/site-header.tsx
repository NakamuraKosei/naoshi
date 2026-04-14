import { Logo } from "@/components/brand/logo";
import { HeaderNav } from "@/components/layout/header-nav";
import { cn } from "@/lib/cn";

/**
 * サイト共通ヘッダー
 * - 白背景、下ボーダー、高さ64px（design.md 7.2）
 * - ロゴ + HeaderNav（認証状態に応じてナビを切り替え）
 * - ヘッダーのみ欲しい画面（/app等）でも使い回せるよう、layout.tsxには置かず各ページで配置する
 */
export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-16 w-full bg-surface border-b border-border",
        className,
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Logo size="md" />
        <HeaderNav />
      </div>
    </header>
  );
}
