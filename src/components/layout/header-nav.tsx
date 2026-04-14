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
 *
 * モバイルではハンバーガーメニューで折りたたむ
 */
export function HeaderNav() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  // モバイルメニューの開閉
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) {
      setIsLoggedIn(false);
      return;
    }

    const supabase = createClient();

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

  // メニュー外タップで閉じる
  useEffect(() => {
    if (!menuOpen) return;
    const handleClose = () => setMenuOpen(false);
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  // 読み込み中はちらつき防止
  if (isLoggedIn === null) {
    return <nav className="flex items-center gap-6 min-w-[140px]" />;
  }

  const isFreePlan = !plan || plan === "free";

  // --- ログイン済み ---
  if (isLoggedIn) {
    return (
      <nav aria-label="メインナビゲーション" className="relative">
        {/* デスクトップ表示 */}
        <div className="hidden items-center gap-6 md:flex">
          {isFreePlan && (
            <Link
              href="/pricing"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              プランを選ぶ
            </Link>
          )}
          <Link href="/app" className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover">
            なおす
          </Link>
          <Link href="/account" className="text-sm font-medium text-text-secondary transition-colors hover:text-primary">
            マイページ
          </Link>
          <button type="button" onClick={handleLogout} className="text-sm font-medium text-text-muted transition-colors hover:text-text-secondary">
            ログアウト
          </button>
        </div>

        {/* モバイル: ハンバーガーボタン */}
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-gray-100 md:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* モバイル: ドロップダウンメニュー */}
        {menuOpen && (
          <div
            className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl border border-border bg-surface py-2 shadow-lg md:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {isFreePlan && (
              <Link
                href="/pricing"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-gray-50"
              >
                プランを選ぶ
              </Link>
            )}
            <Link
              href="/app"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-gray-50"
            >
              なおす
            </Link>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-50"
            >
              マイページ
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-text-muted transition-colors hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        )}
      </nav>
    );
  }

  // --- 未ログイン ---
  return (
    <nav aria-label="メインナビゲーション" className="flex items-center gap-4 md:gap-6">
      <Link href="/pricing" className="text-sm font-medium text-text-secondary transition-colors hover:text-primary">
        料金
      </Link>
      <Link href="/login" className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover">
        ログイン
      </Link>
    </nav>
  );
}
