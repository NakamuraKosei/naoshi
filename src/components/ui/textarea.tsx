import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * テキストエリア（design.md 6.2）
 * - 白背景、1px border、radius 14px、padding 20px
 * - Body Large 18px / 行間 1.8（日本語本文向け）
 * - resize-y、フォーカスでプライマリリング
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-surface border border-border rounded-lg",
          "p-5 text-lg leading-[1.8] text-text-primary",
          "placeholder:text-text-muted",
          "resize-y transition-colors duration-200",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    );
  },
);
