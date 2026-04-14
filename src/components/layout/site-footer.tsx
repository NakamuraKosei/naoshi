import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

/**
 * サイト共通フッター（design.md 7.1.7）
 * - 白背景、縦パディング py-12
 * - ロゴ / リンク（利用規約・プライバシー・特商法・お問い合わせ）/ コピーライト
 */
const footerLinks = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/legal", label: "特定商取引法に基づく表記" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={cn(
        "w-full bg-surface border-t border-border py-12",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Logo size="md" />
          <p className="text-sm text-text-secondary">
            AIで書いたレポートを、自然な日本語に。
          </p>
        </div>

        <nav
          aria-label="フッターナビゲーション"
          className="flex flex-wrap gap-x-6 gap-y-3"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl px-6">
        <p className="text-xs text-text-muted">
          © {year} Naoshi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
