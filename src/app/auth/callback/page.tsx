"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/logo";

/**
 * Auth callback page (client-side)
 *
 * Handles:
 *   1. PKCE flow: ?code=xxx -> exchangeCodeForSession
 *   2. Implicit flow: #access_token=xxx -> auto-detected
 *   3. Already logged in: code exchange fails but session exists -> redirect
 *   4. Google OAuth: redirect with code or hash
 *   5. Fallback: onAuthStateChange listener
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackHandler />
    </Suspense>
  );
}

function CallbackHandler() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let handled = false;

    function redirectToApp() {
      if (!handled) {
        handled = true;
        router.replace("/app");
      }
    }

    async function handleCallback() {
      // 1. PKCE flow: ?code=xxx
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          redirectToApp();
          return;
        }
        // exchange failed -> code may be used/expired
        // BUT user might already be logged in (e.g. clicked link twice)
        console.error("[auth/callback] code exchange failed:", exchangeError.message);
      }

      // 2. Implicit flow: #access_token=xxx (Google OAuth etc.)
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          redirectToApp();
          return;
        }
      }

      // 3. Check if already logged in (code expired but session exists)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirectToApp();
        return;
      }

      // 4. Fallback: wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
            redirectToApp();
          }
        },
      );

      // 5. Final check after short wait (covers race conditions)
      setTimeout(async () => {
        if (handled) return;
        // One more getUser check before showing error
        const { data: { user: retryUser } } = await supabase.auth.getUser();
        if (retryUser) {
          redirectToApp();
        } else {
          subscription.unsubscribe();
          setError(true);
        }
      }, 3000);

      return () => subscription.unsubscribe();
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-primary-lighter px-6">
        <div className="w-full max-w-md rounded-xl bg-surface p-10 text-center shadow-sm">
          <Logo size="md" asLink={false} />
          <p className="mt-6 text-base text-text-secondary">
            ログインリンクの有効期限が切れているか、すでに使用済みです。
          </p>
          <p className="mt-2 text-sm text-text-muted">
            お手数ですが、もう一度ログインをお試しください。
          </p>
          <a
            href="/login"
            className="mt-8 inline-block rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            ログイン画面へ
          </a>
        </div>
      </main>
    );
  }

  return <CallbackLoading />;
}

function CallbackLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-lighter px-6">
      <div className="w-full max-w-md rounded-xl bg-surface p-10 text-center shadow-sm">
        <Logo size="md" asLink={false} />
        <p className="mt-6 text-base text-text-secondary">
          ログイン処理中です...
        </p>
        <div className="mt-4 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    </main>
  );
}
