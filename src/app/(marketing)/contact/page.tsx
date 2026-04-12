import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";

// お問い合わせ窓口のメールアドレス（MVPでは仮のアドレス）
// 正式ドメイン確定後に差し替える
const SUPPORT_EMAIL = "support@naoshi.example.com";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "Naoshi のお問い合わせ窓口です。不具合報告・ご要望・その他のお問い合わせを受け付けています。",
};

/**
 * お問い合わせページ
 * - requirements.md 第3.5 に従い、MVPではGoogle Form埋め込みで代替可
 * - 現状はメール誘導＋将来フォームを差し込む領域を用意
 */
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <section className="mx-auto w-full max-w-3xl px-6 py-24">
          {/* 見出し */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-text-primary md:text-5xl">
              お問い合わせ
            </h1>
            <p className="mt-6 text-lg leading-[1.75] text-text-secondary">
              不具合のご報告、機能のご要望、その他のご質問を受け付けています。
              内容を確認の上、順次ご返信いたします。
            </p>
          </header>

          {/* メール案内カード */}
          <Card className="text-center">
            <p className="text-sm text-text-secondary">メールでのお問い合わせ</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-3 inline-block text-2xl font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-6 text-sm leading-[1.75] text-text-muted">
              お問い合わせの際は、以下の内容を記載いただけるとスムーズです。
            </p>
            <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-text-secondary [&>li]:pl-6 [&>li]:relative before:[&>li]:absolute before:[&>li]:left-0 before:[&>li]:content-['・']">
              <li>お使いのプラン（無料／ライト／ヘビー）</li>
              <li>発生した事象と、再現手順</li>
              <li>ご利用の環境（ブラウザ・OS）</li>
            </ul>
          </Card>

          {/* よくある質問への誘導 */}
          <div className="mt-12 text-center">
            <p className="text-sm text-text-secondary">
              料金やプランに関するご質問は、
              <Link href="/pricing" className="text-primary hover:underline">
                料金ページ
              </Link>
              の FAQ もご確認ください。
            </p>
          </div>

          {/* 注記 */}
          <p className="mt-16 text-center text-xs text-text-muted">
            ※ メールアドレスはMVP向けの仮表記です。正式版公開前に差し替えます。
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
