import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * テキスト入力欄
 * - 白背景、1px border、radius 10px
 * - フォーカスでプライマリリング
 * - プレースホルダー色: text-muted
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full bg-surface border border-border rounded-md",
          "px-4 py-3 text-base text-text-primary",
          "placeholder:text-text-muted",
          "transition-colors duration-200",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
