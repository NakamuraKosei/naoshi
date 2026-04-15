// server-side auth callback (fallback)
// Primary flow is client-side at /auth/callback
// This route handles cases where Supabase redirects to /api/auth/callback directly

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// リダイレクト先のホワイトリスト（Open Redirect 防止）
const ALLOWED_REDIRECTS = ["/app", "/account", "/pricing", "/history"];

function getSafeRedirect(raw: string | null): string {
  if (!raw) return "/app";
  // protocol-relative URL（//evil.com）、javascript:、外部URLを明示的に拒否
  if (raw.startsWith("//") || raw.includes(":") || !raw.startsWith("/")) {
    return "/app";
  }
  // ホワイトリストの完全一致のみ許可
  if (ALLOWED_REDIRECTS.includes(raw)) return raw;
  return "/app";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // ログイン後のリダイレクト先（ホワイトリストで検証）
  const next = getSafeRedirect(url.searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    // server exchange failed -> try client-side
    const clientUrl = new URL("/auth/callback", url.origin);
    clientUrl.searchParams.set("code", code);
    return NextResponse.redirect(clientUrl);
  }

  return NextResponse.redirect(new URL("/login", url.origin));
}
