import type { Metadata } from "next";
import { LegalPageShell } from "@/components/marketing/legal-page-shell";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "Naoshi の特定商取引法に基づく表記です。",
};

/**
 * 特定商取引法に基づく表記（MVP向け、値はTBD）
 */
type Row = {
  label: string;
  value: string;
};

const rows: Row[] = [
  { label: "販売事業者名", value: "（TBD）" },
  { label: "運営責任者", value: "（TBD）" },
  { label: "所在地", value: "（TBD：請求があった場合は遅滞なく開示します）" },
  { label: "電話番号", value: "（TBD：請求があった場合は遅滞なく開示します）" },
  { label: "メールアドレス", value: "（TBD）" },
  {
    label: "販売URL",
    value: "https://naoshi.example.com（TBD：正式ドメイン未定）",
  },
  {
    label: "販売価格",
    value:
      "各プランの表示価格（税込）に従います。詳細は料金ページをご確認ください。",
  },
  {
    label: "商品代金以外の必要料金",
    value: "インターネット接続料・通信料はお客様のご負担となります。",
  },
  {
    label: "支払方法",
    value: "クレジットカード決済（Stripeを利用）",
  },
  {
    label: "支払時期",
    value:
      "月額プランは各決済日、年額プランは申込時、週プランは各週の更新日に自動決済されます。",
  },
  {
    label: "商品の引渡時期",
    value: "決済完了後、直ちに本サービスをご利用いただけます。",
  },
  {
    label: "返金・キャンセルポリシー",
    value:
      "デジタルサービスの性質上、原則として返金は行っていません。未使用分については個別にご相談ください。解約はマイページからいつでも行えます。",
  },
  {
    label: "動作環境",
    value:
      "最新版のChrome / Safari / Edge / Firefox を推奨します。JavaScriptを有効にしてください。",
  },
];

export default function LegalPage() {
  return (
    <LegalPageShell title="特定商取引法に基づく表記" updatedAt="2026-04-11">
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
        ※ 本ページの値はMVP向けプレースホルダーです。正式版公開前に確定値で差し替えます。
      </p>
    </LegalPageShell>
  );
}
