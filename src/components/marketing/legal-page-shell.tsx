import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * 法的ページ（利用規約・プライバシー・特商法）の共通シェル
 * - ヘッダー/フッター付き
 * - 白背景、max-w-3xl、見出し＋本文
 * - 本文はdesign.mdの本文スタイルに沿ったタイポで表示
 */
type LegalPageShellProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <article className="mx-auto w-full max-w-3xl px-6 py-24">
          <header className="mb-12">
            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-text-primary md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-text-muted">
              最終更新日：{updatedAt}
            </p>
          </header>
          <div className="space-y-10 text-base leading-[1.75] text-text-secondary [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-text-primary [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text-primary [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
