/**
 * FAQ アコーディオン（design.md 7.1.5）
 * - HTML標準の <details><summary> で実装（外部ライブラリ不要）
 */
type FaqItem = {
  q: string;
  a: string;
};

const defaultFaqs: FaqItem[] = [
  {
    q: "Naoshi はどんなサービスですか？",
    a: "AIで書いた日本語レポートを、自然な日本語に整えるツールです。文体・語彙・接続詞・語尾などを書き換え、AI特有の硬さを取り除きます。",
  },
  {
    q: "参考文献や固有名詞は改変されませんか？",
    a: "はい。著者名・書名・年号・直接引用・固有名詞は原文のまま保持するルールで動作します。事実や数値の捏造も行いません。",
  },
  {
    q: "だ・である調とですます調、両方使えますか？",
    a: "どちらにも対応しています。学術レポートなら「だ・である調」、感想文や一般的な文章なら「ですます調」を選べます。",
  },
  {
    q: "「標準」と「AI対策強化」モードの違いは？",
    a: "「標準」モードはレポートの質を重視し、学術的な文体を維持しながらAI特有の表現を自然に整えます。「AI対策強化」モードはAI検出ツールに引っかかりにくい文章に変換することを優先します。提出先でAI検出チェックが行われる場合は「AI対策強化」をお試しください。",
  },
  {
    q: "無料プランだけでも使えますか？",
    a: "はい。無料プランはメール登録のみで、1回300字・1日1回までご利用いただけます。まずはお試しください。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい。マイページのCustomer Portalからいつでも解約できます。解約後も期間末までは利用可能です。",
  },
  {
    q: "入力したレポート本文は保存されますか？",
    a: "プライバシー配慮のため、入力テキストはログに残しません。履歴機能はログインユーザー本人のみが閲覧できます。",
  },
];

type FaqListProps = {
  items?: FaqItem[];
};

export function FaqList({ items = defaultFaqs }: FaqListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details
          key={index}
          className="group rounded-lg border border-border bg-surface p-6 transition-colors open:border-primary/40"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
            <span>{item.q}</span>
            {/* 開閉マーク（開くと回転） */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 flex-none text-text-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <p className="mt-4 text-sm leading-[1.75] text-text-secondary">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
