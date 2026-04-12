// proxy.ts（旧 middleware.ts）から呼び出すセッションリフレッシュ処理
// @supabase/ssr の推奨パターンを Next.js 16 向けに実装する

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// セッションを更新しつつ、未ログインで保護ルートへアクセスした場合は /login へリダイレクト
export async function updateSession(request: NextRequest) {
  // デフォルトでは次のリクエストにそのまま通す
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 環境変数が未設定ならセッション処理をスキップ（ローカル .env 未設定時対策）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  // proxy 用の Supabase クライアント
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // リクエスト側にもセットしつつ、新しい NextResponse を作り直して反映
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() を呼ぶことでセッションを検証＆リフレッシュする
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  // 保護ルート: /app, /account, /history
  const isProtected =
    pathname.startsWith("/app") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/history");

  if (!user && isProtected) {
    // 未ログインなら /login にリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
