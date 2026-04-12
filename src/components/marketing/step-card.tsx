import { Card } from "@/components/ui/card";

/**
 * 使い方セクションのステップカード（design.md 7.1.3）
 * - 丸いステップ番号＋見出し＋本文
 */
type StepCardProps = {
  step: number;
  title: string;
  description: string;
};

export function StepCard({ step, title, description }: StepCardProps) {
  return (
    <Card interactive className="flex h-full flex-col gap-4">
      {/* ステップ番号：primary 背景の丸＋白文字 */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
      <p className="text-sm leading-[1.75] text-text-secondary">{description}</p>
    </Card>
  );
}
