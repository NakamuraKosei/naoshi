"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * ヘッダーナビゲーション（認証状態に応じて切り替え）
 * - ログイン済み（無料）: 「プランを選ぶ」→/pricing ・「なおす」→/app ・「マイページ」→/account ・「ログアウト」
 * - ログイン済み（有料）: 「なおす」→/app ・「マイページ」→/account ・「ログアウト」
 * - 未ログイン: 「料金」→/pricing ・「ログイン」→/login
 */
export function HeaderNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  // プラン情報（無料プランかどうかの判定用）
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      setIsLoggedIn(false);
      return;
    }

    const supabase = createClient();

    // 認証状態とプラン情報を取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) {
        supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setPlan(data?.plan ?? "free");
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("plan")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            setPlan(data?.plan ?? "free");
          });
      } else {
        setPlan(null);
      }
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

  const isFreePlan = !plan || plan === "free";

  if (isLoggedIn) {
    return (
      <nav
        aria-label="メインナビゲーション"
        className="flex items-center gap-6"
      >
        {/* 無料プランのみ: プランを選ぶボタン */}
        {isFreePlan && (
          <Link
            href="/pricing"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            プランを選ぶ
          </Link>
        )}
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
