/**
 * ヘビープラン限定機能セクション（濃色帯 + 白パネル）
 * - 高精度モード / マイ文体 を details/summary で開閉表示（JS不要）
 * - LP（トップ）と料金ページで共通利用する
 */
export function HeavyPlanFeatures() {
  return (
    <section className="bg-surface-dark">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-[#EEF3FB] px-3.5 py-1 text-xs font-semibold text-primary">
            ヘビープラン限定
          </span>
          <h2 className="mt-4 text-[26px] font-semibold leading-[1.35] text-text-on-dark md:text-[32px]">
            もう一段上の、<br className="sm:hidden" />自然な仕上がりへ。
          </h2>
          <p className="mt-4 text-base leading-[1.75] text-text-on-dark/80">
            ヘビープランでは、精度と&ldquo;あなたらしさ&rdquo;を高める2つの機能が使えます。
          </p>
        </div>

        {/* クリックで詳細を開閉。既定は各機能の一行説明のみ（details/summaryでJS不要）
            ホバー時は他のカードと同じく浮き上がるアニメーション */}
        <div className="mx-auto mt-14 max-w-3xl divide-y divide-border/60 overflow-hidden rounded-3xl bg-surface shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl">
          {/* 高精度モード（クリックで詳細） */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-7 py-6 transition-colors hover:bg-[#FAFBFD] md:px-9 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">
                    精度重視
                  </span>
                  <h3 className="text-base font-bold text-text-primary md:text-lg">高精度モード</h3>
                </div>
                <p className="mt-1.5 text-sm leading-[1.7] text-text-secondary">
                  より高性能なモデルで、AIっぽさをさらに徹底的に抑えます。
                </p>
              </div>
              <span className="flex flex-none items-center gap-1 text-xs font-medium text-primary">
                <span className="group-open:hidden">詳しく</span>
                <span className="hidden group-open:inline">閉じる</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </summary>
            <div className="px-7 pb-6 md:px-9">
              <p className="text-sm leading-[1.95] text-text-secondary">
                通常よりも高性能なモデルを使い、AIらしい言い回しや構成のパターンをより深く崩して書き換えます。<br className="hidden sm:block" />コピペチェック・AI判定への対策をより強めたいときにおすすめです。
              </p>
              <p className="mt-2 text-xs text-text-muted">※ 文字数を3倍消費します。</p>
            </div>
          </details>

          {/* マイ文体（クリックで詳細＝ビフォーアフターの図） */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-4 px-7 py-6 transition-colors hover:bg-[#FAFBFD] md:px-9 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-primary-lighter px-3 py-1 text-xs font-semibold text-primary">
                    あなたらしさ
                  </span>
                  <h3 className="text-base font-bold text-text-primary md:text-lg">マイ文体</h3>
                </div>
                <p className="mt-1.5 text-sm leading-[1.7] text-text-secondary">
                  あなたが書いた文章を一つ登録すると、語尾や言い回し、文の長さといった癖を学習し、<br className="hidden sm:block" />変換結果をあなたらしい文体に寄せます。
                </p>
              </div>
              <span className="flex flex-none items-center gap-1 text-xs font-medium text-primary">
                <span className="group-open:hidden">詳しく</span>
                <span className="hidden group-open:inline">閉じる</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </summary>
            <div className="px-7 pb-8 md:px-9">
              {/* ビフォー → アフター（PC横並び / スマホ縦並び） */}
              <div className="grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
                {/* ビフォー：薄いグレー */}
                <div className="rounded-2xl bg-[#F4F6FA] p-5">
                  <p className="text-xs font-semibold text-text-muted">変換前のAIの文章</p>
                  <p className="mt-2.5 text-sm leading-[2] text-text-secondary">
                    近年、テクノロジーの進化は社会に大きな影響を与えています。特に人工知能の発展は、様々な分野の効率化を促進しています。
                  </p>
                </div>

                {/* 矢印（スマホは下向き） */}
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 rotate-90 md:rotate-0" aria-hidden>
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span className="text-[11px] font-medium text-text-muted">変換</span>
                  </div>
                </div>

                {/* アフター：淡い水色＋薄いブランド枠。反映箇所を淡くハイライト */}
                <div className="rounded-2xl border border-[#378ADD]/30 bg-[#EFF3FB] p-5">
                  <p className="text-xs font-semibold text-primary">あなたの文体に寄せた文章</p>
                  <p className="mt-2.5 text-sm leading-[2] text-text-primary">
                    テクノロジーの進化は、私たちの暮らしや働き方を大きく変えつつある。
                    <span className="rounded bg-[#C4D8F4] px-1 font-semibold text-primary">筆者</span>
                    が注目しているのは、その可能性が
                    <span className="rounded bg-[#C4D8F4] px-1 font-semibold text-primary">今後どこまで広がっていくのか</span>
                    、
                    <span className="rounded bg-[#C4D8F4] px-1 font-semibold text-primary">という点ではないだろうか</span>
                    。
                  </p>
                </div>
              </div>

              {/* 反映された特徴 */}
              <div className="mt-6">
                <p className="mb-2.5 text-xs font-semibold text-text-muted">あなたの文章から学んだ特徴</p>
                <div className="flex flex-wrap gap-2">
                  {["一文が長め", "「筆者」を使う", "問いかけで締める"].map((trait) => (
                    <span
                      key={trait}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF3FB] px-3 py-1.5 text-sm font-medium text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* プライバシー */}
              <p className="mt-6 flex items-center gap-1.5 text-xs leading-relaxed text-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                学んだ特徴だけを使って変換します。登録した本文は保存しません。
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
