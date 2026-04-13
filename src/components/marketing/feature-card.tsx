import { Card } from "@/components/ui/card";

/**
 * 特徴セクションのカード（design.md 7.1.2）
 * - 現状はアイコンを簡易的に丸＋チェック風のプレースホルダで表現
 *   （外部アイコンライブラリ未導入のためSVGで代替）
 */
type FeatureCardProps = {
  title: string;
  description: React.ReactNode;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <Card interactive className="flex h-full flex-col gap-4">
      {/* アイコン枠：primary-light 背景の丸＋プライマリ色のチェックマーク */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary"
          aria-hidden
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="text-sm leading-[1.75] text-text-secondary">{description}</p>
    </Card>
  );
}
