import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { FaqList } from "@/components/marketing/faq-list";
import { FeatureCard } from "@/components/marketing/feature-card";
import { StepCard } from "@/components/marketing/step-card";
import { HeavyPlanFeatures } from "@/components/marketing/heavy-plan-features";
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
              <h2 className="text-[26px] font-semibold leading-[1.35] text-text-primary md:text-[32px]">
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
                icon={
                  /* 「あ」= 日本語特化 */
                  <span className="text-xl font-bold leading-none text-primary" aria-hidden>
                    あ
                  </span>
                }
              />
              <FeatureCard
                title="参考文献を完全保護"
                description="著者名・書名・年号・直接引用は一切改変しません。安心して提出できます。"
                icon={
                  /* 盾＋チェック = 保護 */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary" aria-hidden>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                }
              />
              <FeatureCard
                title="コピペ・AI検出に配慮"
                description="文の構造・語彙・段落のつくりから書き換えるため、コピペチェッカーやAI検出の判定にも配慮した仕上がりになります。"
                icon={
                  /* 虫めがね＋チェック = 検出対策 */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.5" y2="16.5" />
                    <polyline points="8.5 11 10.5 13 14 9.5" />
                  </svg>
                }
              />
            </div>
          </div>
        </section>

        {/* 3. 使い方セクション（白 / py-24 / 3ステップ） */}
        <section id="how-it-works" className="bg-surface">
          <div className="mx-auto w-full max-w-6xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-[26px] font-semibold leading-[1.35] text-text-primary md:text-[32px]">
                3ステップで、<br className="sm:hidden" />すぐになおる
              </h2>
              <p className="mt-4 text-base leading-[1.75] text-text-secondary">
                難しい設定は不要です。貼り付けてボタンを押すだけ。
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <StepCard
                step={1}
                title="貼り付ける"
                description="AIで書いたレポートの本文を、入力欄にそのまま貼り付けます。"
                figure={
                  /* 入力欄のミニ図：テキストが入った状態＋文字数カウンター */
                  <div className="w-full max-w-[240px]">
                    <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
                      <p className="text-[10px] font-medium text-text-muted">元の文章</p>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-[#DDE4EE]" />
                        <div className="h-1.5 w-[92%] rounded-full bg-[#DDE4EE]" />
                        <div className="h-1.5 w-full rounded-full bg-[#DDE4EE]" />
                        <div className="h-1.5 w-[58%] rounded-full bg-[#DDE4EE]" />
                      </div>
                      <p className="mt-2.5 text-right text-[10px] tabular-nums text-text-muted">
                        1,240 / 5,000 字
                      </p>
                    </div>
                  </div>
                }
              />
              <StepCard
                step={2}
                title="なおすボタンを押す"
                description={<>文体を選んで「なおす」をクリック。<br />数秒で自然な日本語に変わります。</>}
                figure={
                  /* 文体トグル＋なおすボタンのミニ図（クリックカーソル付き） */
                  <div className="flex w-full max-w-[240px] flex-col items-center gap-3.5">
                    <div className="inline-flex items-center rounded-full border border-border bg-surface p-0.5 shadow-sm">
                      <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-semibold text-white">
                        だ・である調
                      </span>
                      <span className="px-3 py-1 text-[10px] font-medium text-text-muted">
                        です・ます調
                      </span>
                    </div>
                    <div className="relative">
                      <span className="inline-flex items-center rounded-full bg-primary px-9 py-2 text-sm font-bold text-white shadow-md">
                        なおす
                      </span>
                      {/* クリックカーソル */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="absolute -bottom-2.5 -right-2 h-5 w-5 text-text-primary drop-shadow-sm"
                        fill="white"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                      >
                        <path d="M5 3l14 8-6.5 1.5L9 19z" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                }
              />
              <StepCard
                step={3}
                title="編集してコピー"
                description={<>気になる部分はその場で直せます。<br />仕上げてコピーし、そのまま使えます。</>}
                figure={
                  /* 出力欄のミニ図：なおした文章＋コピー完了チップ */
                  <div className="w-full max-w-[240px]">
                    <div className="rounded-lg border border-[#378ADD]/30 bg-surface p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-primary">なおした文章</p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-lighter px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5" aria-hidden>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          コピーしました
                        </span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-[#C4D8F4]" />
                        <div className="h-1.5 w-[85%] rounded-full bg-[#C4D8F4]" />
                        <div className="h-1.5 w-[95%] rounded-full bg-[#C4D8F4]" />
                        {/* 編集中のカーソルを表す短いバー＋縦線 */}
                        <div className="flex items-center gap-0.5">
                          <div className="h-1.5 w-[42%] rounded-full bg-[#C4D8F4]" />
                          <div className="h-3 w-px bg-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* 3.5 ヘビープラン限定機能（LP・料金ページ共通コンポーネント） */}
        <HeavyPlanFeatures />

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
