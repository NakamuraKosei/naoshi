import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// (app) ルートグループ配下の認証ガードレイアウト。
// /app と /account はログイン必須のため、ここで一括チェックする。
// proxy.ts でもリダイレクトしているが、静的プリレンダーされるページで
// プロキシが確実に当たらないケースに備えた二重防御でもある。
export const dynamic = "force-dynamic";

export default async function AppGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 環境変数未設定時（ローカル開発の初期状態）はガードをスキップ
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return <>{children}</>;
  }

  // Supabase セッションからユーザーを取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 未ログインなら /login へリダイレクト
  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
