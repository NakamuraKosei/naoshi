import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * タグ／バッジ（design.md 6.7）
 * - Primaryバッジ: 背景 primary-light、文字 primary
 * - 角丸: 9999px（ピル型）
 * - フォント: Caption / 600
 * - パディング: 4px 12px
 */
type BadgeVariant = "primary" | "neutral" | "success" | "warning" | "error";

const variantClass: Record<BadgeVariant, string> = {
  primary: "bg-primary-light text-primary",
  neutral: "bg-primary-lighter text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "primary",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
