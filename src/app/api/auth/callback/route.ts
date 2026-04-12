// server-side auth callback (fallback)
// Primary flow is client-side at /auth/callback
// This route handles cases where Supabase redirects to /api/auth/callback directly

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // ログイン後のリダイレクト先
  const next = url.searchParams.get("redirect") ?? "/app";

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
