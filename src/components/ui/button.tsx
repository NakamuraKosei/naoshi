import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * ボタン（design.md 6.1）
 *
 * バリアント:
 * - primary   : ブランド青背景、白文字、ホバーで濃い青＋わずかに上方向
 * - secondary : 白背景、青文字、青ボーダー、ホバーで primary-light
 * - text      : 透明背景、青文字、ホバーでアンダーライン
 * - cta       : ダーク背景セクション上用。白背景、濃紺文字
 */
type Variant = "primary" | "secondary" | "text" | "cta";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-all duration-200 ease-out " +
  "disabled:pointer-events-none disabled:opacity-60 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const variantClass: Record<Variant, string> = {
  // design.md 6.1.1 Primary
  primary:
    "bg-primary text-white rounded-md hover:bg-primary-hover hover:-translate-y-0.5 disabled:bg-text-muted",
  // design.md 6.1.2 Secondary
  secondary:
    "bg-surface text-primary border border-primary rounded-md hover:bg-primary-light",
  // design.md 6.1.3 Text Button
  text: "bg-transparent text-primary hover:underline underline-offset-4",
  // design.md 6.1.4 CTA Button（ダークセクション上）
  cta: "bg-surface text-text-primary rounded-md hover:bg-primary-lighter",
};

const sizeClass: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  // design.md 6.1.1 padding 14px 28px
  md: "text-base px-7 py-[14px]",
  lg: "text-base md:text-lg px-8 py-4",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variantClass[variant], sizeClass[size], className)}
        {...props}
      />
    );
  },
);
