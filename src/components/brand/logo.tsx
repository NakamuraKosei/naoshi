"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

/**
 * Naoshi ロゴ（design.md 第8章）
 * - テキストロゴ「Naoshi」、Inter Bold、色 Primary
 * - ログイン済み → /app、未ログイン → /（LP）にリンク
 */
type LogoProps = {
  size?: "sm" | "md" | "lg";
  asLink?: boolean;
  className?: string;
};

const sizeClass = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl md:text-[40px]",
} as const;

export function Logo({ size = "md", asLink = true, className }: LogoProps) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setHref("/app");
    });
  }, []);

  const content = (
    <span
      className={cn(
        "font-bold tracking-tight text-primary",
        "[font-family:var(--font-inter),'Inter',system-ui,sans-serif]",
        sizeClass[size],
        className,
      )}
    >
      Naoshi
    </span>
  );

  if (!asLink) return content;

  return (
    <Link href={href} aria-label="Naoshi トップへ" className="inline-flex">
      {content}
    </Link>
  );
}
