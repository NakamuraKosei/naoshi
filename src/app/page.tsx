import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { FaqList } from "@/components/marketing/faq-list";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepCard } from "@/components/marketing/step-card";
import { HeroConverter } from "@/components/hero-converter";

/**
 * ランディングページ（design.md 7.1）
 *
 * セクション構成（厳密）:
 *  1. ヒーロー（白）— ダイレクト変換フロー
 *  2. 特徴（primary-lighter）
 *  3. 使い方（白）
 *  4. 料金（primary-lighter）
 *  5. FAQ（白）
 *  6. CTAバナー（surface-dark）
 *  7. フッター
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* 1. ヒーロー（白背景）— インタラクティブ変換UI */}
        <HeroConverter />

        {/* 2. 特徴セクション（primary-lighter / py-24 / 3カラム） */}
        <section className="bg-primary-lighter">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                Naoshi が選ばれる理由
              </h2>
              <p className="mt-4 text-base leading-[1.75] text-text-secondary">
                海外系ツールでは届かない、日本語レポートの自然さにこだわりました。
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              <FeatureCard
                title="日本語学術文に特化"
                description="AI特有の定型冒頭や機械的な列挙を避け、日本語として自然な流れに整えます。"
              />
              <FeatureCard
                title="参考文献を完全保護"
                description="著者名・書名・年号・直接引用は一切改変しません。安心して提出できます。"
              />
              <FeatureCard
                title="だ・である調 / ですます調"
                description="学術レポートにも感想文にも。用途にあわせて文体を選べます。"
              />
            </div>
          </div>
        </section>

        {/* 3. 使い方セクション（白 / py-24 / 3ステップ） */}
        <section id="how-it-works" className="bg-surface">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                3ステップで、すぐに整う
              </h2>
              <p className="mt-4 text-base leading-[1.75] text-text-secondary">
                難しい設定は不要です。貼り付けてボタンを押すだけ。
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              <StepCard
                step={1}
                title="貼り付ける"
                description="AIで書いたレポートの本文を、入力欄にそのまま貼り付けます。"
              />
              <StepCard
                step={2}
                title="なおすボタンを押す"
                description="文体を選んで「なおす」をクリック。数秒で自然な日本語に変わります。"
              />
              <StepCard
                step={3}
                title="コピーして使う"
                description="出力された文章をコピーして、そのままレポートに貼り付けるだけです。"
              />
            </div>
          </div>
        </section>

        {/* 4. 料金セクション（primary-lighter / py-24 / 4プラン） */}
        <section id="pricing" className="bg-primary-lighter">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                シンプルな料金体系
              </h2>
              <p className="mt-4 text-base leading-[1.75] text-text-secondary">
                必要な分だけ、無理なく使えるプランを用意しました。
              </p>
            </div>
            <div className="mt-16">
              <PricingPlans />
            </div>
            <p className="mt-8 text-center text-sm text-text-muted">
              表示価格は税込です。プラン変更・解約はいつでも行えます。
            </p>
          </div>
        </section>

        {/* 5. FAQ（白 / py-24 / max-w-3xl / アコーディオン） */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-3xl px-6 py-24">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                よくある質問
              </h2>
              <p className="mt-4 text-base leading-[1.75] text-text-secondary">
                気になるポイントをまとめました。
              </p>
            </div>
            <div className="mt-12">
              <FaqList />
            </div>
          </div>
        </section>

        {/* 6. CTAバナー（surface-dark / py-20 / 白文字＋白ボタン） */}
        <section className="bg-surface-dark">
          <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
            <h2 className="text-3xl font-semibold leading-tight text-text-on-dark md:text-4xl">
              もうAIチェッカーは怖くない
            </h2>
            <p className="mt-4 text-base leading-[1.75] text-text-on-dark/80">
              無料プランなら、メール登録だけですぐに試せます。
            </p>
            <div className="mt-10">
              <a href="#hero">
                <Button variant="cta" size="lg">
                  無料ではじめる
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
