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
    a: "日本語特化のAIヒューマナイザーです。レポートを貼り付けて「なおす」を押すだけで、\n人が書いたような自然な日本語に書き換えます。参考文献や固有名詞はそのまま保持されます。",
  },
  {
    q: "AIヒューマナイザーとは何ですか？",
    a: "AIが生成した文章を、人間が書いたような自然な文章に書き換えるツールの総称です。\n海外では英語向けのサービスが多いですが、Naoshiは日本語に特化しています。",
  },
  {
    q: "参考文献や固有名詞は改変されませんか？",
    a: "はい。著者名・書名・年号・直接引用・固有名詞は原文のまま保持するルールで動作します。\n事実や数値の捏造も行いません。",
  },
  {
    q: "コピペチェッカー・AI検出ツールの対策はできますか？",
    a: "Naoshiは文の構造・語彙・段落構成を書き換えるため、コピペチェッカーやAI検出ツールの判定に対しても効果が期待できます。ただし、各ツールの判定基準は常に変化するため、結果を保証するものではありません。",
  },
  {
    q: "ダブルチェックとは何ですか？",
    a: "通常の変換後にもう1段階、表現の重複やパターンを崩す書き換えを行う機能です。コピペチェッカー対策にも効果的です。文字数は2倍消費されますが、より自然な仕上がりが期待できます。\nヘビープラン（月額・年額）でのみ利用可能です。",
  },
  {
    q: "無料プランだけでも使えますか？",
    a: "はい。無料プランはメール登録のみで、1回300字・月3回までご利用いただけます。\nまずはお試しください。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい。マイページのCustomer Portalからいつでも解約できます。解約後も期間末までは利用可能です。",
  },
  {
    q: "入力したレポート本文は保存されますか？",
    a: "プライバシー配慮のため、入力テキストはログに残しません。\n履歴機能はログインユーザー本人のみが閲覧できます。",
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
          <p className="mt-4 whitespace-pre-line text-sm leading-[1.75] text-text-secondary">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
