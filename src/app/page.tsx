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
                title="日本語レポートに特化"
                description={<>AI特有の定型冒頭や機械的な列挙を避け、<br />日本語として自然な流れに整えます。</>}
              />
              <FeatureCard
                title="参考文献を完全保護"
                description="著者名・書名・年号・直接引用は一切改変しません。安心して提出できます。"
              />
              <FeatureCard
                title="レポートもビジネス文書も"
                description="大学のレポートからメール・提案書・報告書まで。用途にあわせてモードを選べます。"
              />
            </div>
          </div>
        </section>

        {/* 2.5 マイ文体スポットライト（白 / py-24 / 2カラム） */}
        <section className="bg-surface">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="grid items-center gap-12 md:grid-cols-2">
              {/* 左: 説明 */}
              <div>
                <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
                  ヘビープラン
                </span>
                <h2 className="mt-4 text-3xl font-semibold leading-[1.3] text-text-primary md:text-[32px]">
                  あなたの文体で、<br />あなたが書いたように。
                </h2>
                <p className="mt-4 text-base leading-[1.8] text-text-secondary">
                  自分で書いたレポートを一つ登録するだけ。Naoshi があなたの言い回しや語尾、文のリズムを学び、変換結果をあなたらしい文章に寄せます。誰が書いても同じになりがちなAIの文章から、あなたにしか書けない文章へ。
                </p>
                <ul className="mt-6 space-y-3 text-sm text-text-secondary">
                  {[
                    "語尾・言い回し・文の長さといった癖を再現",
                    "事実や参考文献はそのまま。中身は変えません",
                    "登録した本文は保存せず、文体の特徴だけを学習",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 h-4 w-4 flex-none text-primary"
                        aria-hidden
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 右: ビフォー→アフターのイメージ */}
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
                  <p className="mb-2 text-xs font-medium text-text-muted">よくあるAIの文</p>
                  <p className="text-sm leading-[1.85] text-text-secondary">
                    本レポートでは、まずSNSの利点について述べる。次に問題点を検討し、最後に今後のあり方をまとめる。
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                  マイ文体で変換
                </div>
                <div className="rounded-xl border-2 border-primary/30 bg-primary-lighter p-5 shadow-sm">
                  <p className="mb-2 text-xs font-medium text-primary">あなたの文体</p>
                  <p className="text-sm leading-[1.85] text-text-primary">
                    そもそも、SNSは私たちの生活を本当に豊かにしたのだろうか。筆者は、その便利さの裏で見落とされてきたものがあるのではないかと考えている。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 使い方セクション（白 / py-24 / 3ステップ） */}
        <section id="how-it-works" className="bg-surface">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold text-text-primary md:text-[32px]">
                3ステップで、すぐになおる
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
                description={<>文体を選んで「なおす」をクリック。<br />数秒で自然な日本語に変わります。</>}
              />
              <StepCard
                step={3}
                title="編集してコピー"
                description={<>気になる部分はその場で直せます。<br />仕上げてコピーし、そのまま使えます。</>}
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

            {/* ダブルチェック説明 */}
            <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/20 bg-surface px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                  3x
                </span>
                <div>
                  <h4 className="font-semibold text-text-primary">
                    ダブルチェックとは？
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    通常より高精度な上位AIモデルで、表現の重複やパターンをより深く崩して書き換えます。コピペチェッカー対策にも効果的です。文字数を3倍消費します。ヘビープラン限定の機能です。
                  </p>
                </div>
              </div>
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
              AIっぽさのない、<br className="md:hidden" />自然なレポートへ。
            </h2>
            <p className="mt-4 text-base leading-[1.75] text-text-on-dark/80">
              日本語特化AIヒューマナイザー。無料プランなら、メール登録だけですぐに試せます。
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
