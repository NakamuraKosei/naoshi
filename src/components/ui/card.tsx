import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * カード（design.md 6.3）
 * - 白背景、1px border、radius 14px、padding 32px、shadow-sm
 * - ホバーで shadow-md ＋ わずかに上方向
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  // ホバー演出をオンにするか（静的表示なら false）
  interactive?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, interactive = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border rounded-lg p-8 shadow-sm",
        interactive &&
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
});

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xl font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-text-secondary", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-text-secondary", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex items-center gap-3", className)}
      {...props}
    />
  );
}
