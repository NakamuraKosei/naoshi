import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "Naoshi の特定商取引法に基づく表記です。",
};

// 特定商取引法に基づく表記（MVP版）
// TBD値は正式版公開前に確定値で差し替える
type Row = {
  label: string;
  value: string;
};

const rows: Row[] = [
  { label: "販売事業者名", value: "中村耕盛" },
  {
    label: "所在地",
    value: "請求があった場合は遅滞なく開示いたします。",
  },
  {
    label: "電話番号",
    value: "請求があった場合は遅滞なく開示いたします。",
  },
  { label: "メールアドレス", value: "naoshisupport@gmail.com" },
  {
    label: "販売URL",
    value: "https://naoshi.vercel.app",
  },
  {
    label: "販売価格",
    value:
      "無料プラン：0円 / ライトプラン：500円（税込）/ 週 / ヘビープラン（月額）：2,980円（税込）/ 月 / ヘビープラン（年額）：24,000円（税込）/ 年。詳細は料金ページをご確認ください。",
  },
  {
    label: "商品代金以外の必要料金",
    value:
      "インターネット接続料・通信料等はお客様のご負担となります。",
  },
  {
    label: "支払方法",
    value:
      "クレジットカード決済（Visa / Mastercard / JCB / American Express 対応）。決済処理はStripe, Inc.を利用しています。",
  },
  {
    label: "支払時期",
    value:
      "週プランは毎週の更新日、月額プランは毎月の決済日、年額プランは申込時に自動決済されます。",
  },
  {
    label: "商品の引渡時期",
    value:
      "決済完了後、直ちに本サービスをご利用いただけます。",
  },
  {
    label: "契約期間・自動更新",
    value:
      "各プランの契約期間は週次・月次・年次です。契約期間の終了時に自動的に更新されます。解約はマイページからいつでも行えます。解約後も契約期間末日まではサービスをご利用いただけます。",
  },
  {
    label: "返金・キャンセルポリシー",
    value:
      "デジタルサービスの性質上、原則として返金は行っておりません。ただし、サービス障害等により正常に利用できなかった場合は、個別にご相談ください。解約（キャンセル）はマイページからいつでも可能で、違約金は発生しません。",
  },
  {
    label: "動作環境",
    value:
      "Google Chrome / Safari / Microsoft Edge / Firefox の最新版を推奨します。JavaScriptが有効である必要があります。スマートフォン・タブレットにも対応しています。",
  },
];

export default function LegalPage() {
  return (
    <LegalPageShell title="特定商取引法に基づく表記" updatedAt="2026-04-12">
      <p>
        本ページは、特定商取引に関する法律第11条（通信販売についての広告）に基づく表記です。
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-2 p-6 md:grid-cols-[200px_1fr] md:gap-6"
            >
              <dt className="text-sm font-semibold text-text-primary">
                {row.label}
              </dt>
              <dd className="text-sm leading-[1.75] text-text-secondary">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-12 text-sm text-text-muted">
        ※ 記載内容は変更される場合があります。最新の情報は本ページをご確認ください。
      </p>
    </LegalPageShell>
  );
}
