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
    q: "「マイ文体」とは何ですか？",
    a: "自分で書いたレポートを一つ登録すると、その文章の癖（語尾・言い回し・文の長さなど）を学習し、変換結果をあなたらしい文体に寄せる機能です。ヘビープラン限定で、変換画面の「マイ文体」をONにすると反映されます。\n登録した本文は保存されず、抽出した文体の特徴だけを保持します。AIを使わずに自分で書いた文章を登録してください。",
  },
  {
    q: "変換された文章はあとから編集できますか？",
    a: "はい。変換後の文章はそのまま画面上で編集できます。気になる箇所を直してから、コピーしてお使いください。",
  },
{
    q: "無料プランだけでも使えますか？",
    a: "はい。無料プランはメール登録のみで、1回300字・月3回までご利用いただけます。\nまずはお試しください。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい。料金プランページからいつでも解約できます。\n解約後も契約期間の終了日まではそのままご利用いただけます。",
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
