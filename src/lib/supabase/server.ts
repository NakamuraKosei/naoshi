// Supabase サーバー用クライアント
// Next.js 16 の Async Request APIs に対応し、`cookies()` は必ず `await` する。
// Server Component / Route Handler / Server Action から呼び出す用途。

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバー用 Supabase クライアントを生成するヘルパー
// 呼び出し時に毎回 cookies() を await して取得する（Next.js 16 仕様）
export async function createClient() {
  // Next.js 16 からは cookies() が非同期関数なので必ず await
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        // セッション読み取り時に呼ばれる
        getAll() {
          return cookieStore.getAll();
        },
        // セッション書き込み時に呼ばれる
        // Server Component から呼ばれた場合は書き込みできないので握りつぶす
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component から呼ばれた際は set できないので無視
            // proxy.ts 側でセッションリフレッシュを行うため問題ない
          }
        },
      },
    },
  );
}
