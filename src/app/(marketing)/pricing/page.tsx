import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { FaqList } from "@/components/marketing/faq-list";

export const metadata: Metadata = {
  title: "料金プラン",
  description:
    "Naoshi の料金プラン一覧。無料プランから週プラン、月額・年額まで、用途にあわせて選べます。",
};

/**
 * 料金ページ（design.md 7.3 / requirements.md 第7章）
 * - LPの料金セクションを拡張した詳細版
 */
const pricingFaqs = [
  {
    q: "プランの変更はいつ反映されますか？",
    a: "アップグレードは即時反映、差額は日割り計算されます。ダウングレードは次回更新日から反映されます。",
  },
  {
    q: "無料プランから有料プランに切り替えるとどうなりますか？",
    a: "その場で有料プランの機能がすべて使えるようになります。支払いはStripeを通じて安全に処理されます。",
  },
  {
    q: "支払い方法は何がありますか？",
    a: "クレジットカード（Visa / Mastercard / JCB / American Express）に対応しています。",
  },
  {
    q: "返金はできますか？",
    a: "デジタルサービスの性質上、基本的に返金は行っていません。未使用分については個別にご相談ください。",
  },
];

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ページヘッダー（白背景） */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center md:py-32">
            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-text-primary md:text-5xl">
              シンプルな料金体系
            </h1>
            <p className="mt-6 text-lg leading-[1.75] text-text-secondary">
              必要な分だけ、無理なく使えるプランを用意しました。
              いつでもアップグレード・解約できます。
            </p>
          </div>
        </section>

        {/* プランカード（primary-lighter） */}
        <section className="bg-primary-lighter">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <PricingPlans />
            <p className="mt-8 text-center text-sm text-text-muted">
              表示価格は税込です。プラン変更・解約はいつでも行えます。
            </p>
          </div>
        </section>

        {/* 機能比較メモ（白） */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
              すべてのプランに共通
            </h2>
            <ul className="mt-8 space-y-4 text-base leading-[1.75] text-text-secondary">
              <li>・日本語学術文に特化した変換エンジン</li>
              <li>・参考文献・固有名詞・数値の完全保護</li>
              <li>・だ・である調 / です・ます調 の切替</li>
              <li>・変換履歴の閲覧（直近10件、本人のみ）</li>
              <li>・プライバシーに配慮したデータ取り扱い</li>
            </ul>
          </div>
        </section>

        {/* FAQ（primary-lighter） */}
        <section className="bg-primary-lighter">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                料金に関するよくある質問
              </h2>
            </div>
            <div className="mt-12">
              <FaqList items={pricingFaqs} />
            </div>
          </div>
        </section>

        {/* CTAバナー（surface-dark） */}
        <section className="bg-surface-dark">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold leading-tight text-text-on-dark md:text-4xl">
              まずは無料プランで試してみる
            </h2>
            <p className="mt-4 text-base leading-[1.75] text-text-on-dark/80">
              メール登録だけで、すぐに使いはじめられます。
            </p>
            <div className="mt-10">
              <Link href="/login">
                <Button variant="cta" size="lg">
                  無料ではじめる
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
