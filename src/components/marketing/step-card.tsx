import { Card } from "@/components/ui/card";

/**
 * 使い方セクションのステップカード（design.md 7.1.3）
 * - 丸いステップ番号＋見出し＋本文
 */
type StepCardProps = {
  step: number;
  title: string;
  description: React.ReactNode;
  // 操作イメージのミニ図（任意）。カード上部に固定の高さで表示する
  figure?: React.ReactNode;
};

export function StepCard({ step, title, description, figure }: StepCardProps) {
  return (
    <Card interactive className="flex h-full flex-col gap-4">
      {/* 操作イメージ：淡い背景の枠に収めて高さを揃える */}
      {figure && (
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[#F4F7FB] px-5">
          {figure}
        </div>
      )}
      {/* ステップ番号＋見出しを1行に（図がある場合は横並びの方が収まりが良い） */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-base font-bold text-white">
          {step}
        </div>
        <h3 className="text-lg font-semibold text-text-primary md:text-xl">{title}</h3>
      </div>
      <p className="text-sm leading-[1.75] text-text-secondary">{description}</p>
    </Card>
  );
}
