"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * ヘッダーナビゲーション（認証状態に応じて切り替え）
 * - ログイン済み: 「なおす」→/app ・「マイページ」→/account ・「ログアウト」
 * - 未ログイン: 「料金」→/pricing ・「ログイン」→/login
 */
export function HeaderNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      setIsLoggedIn(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ログアウト処理
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // 読み込み中はちらつき防止
  if (isLoggedIn === null) {
    return <nav className="flex items-center gap-6 min-w-[140px]" />;
  }

  if (isLoggedIn) {
    return (
      <nav
        aria-label="メインナビゲーション"
        className="flex items-center gap-6"
      >
        <Link
          href="/app"
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          なおす
        </Link>
        <Link
          href="/account"
          className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
        >
          マイページ
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-text-muted transition-colors hover:text-text-secondary"
        >
          ログアウト
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="メインナビゲーション"
      className="flex items-center gap-6"
    >
      <Link
        href="/pricing"
        className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        料金
      </Link>
      <Link
        href="/login"
        className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        ログイン
      </Link>
    </nav>
  );
}
