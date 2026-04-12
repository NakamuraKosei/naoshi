"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * ログインページ（design.md 7.5）
 *
 * - 背景: primary-lighter
 * - 中央に白カード（max-w-md / p-10 / rounded-xl）
 * - ロゴ、説明文、メール入力、「マジックリンクを送る」Primaryボタン
 * - SiteHeader / SiteFooter は配置しない（7.5 の仕様）
 * - 認証処理はD担当が後で接続する。onSubmit は console.log で停止。
 *   → 接続ポイント: handleSubmit 内の TODO コメント箇所
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      // Magic Link 送信エンドポイントを呼び出す
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setErrorMessage(
          data.error ?? "送信に失敗しました。時間をおいて再度お試しください。",
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMessage("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-primary-lighter px-6 py-16">
      <div className="w-full max-w-md rounded-xl bg-surface p-10 shadow-sm">
        {/* ロゴ */}
        <div className="flex flex-col items-center gap-4">
          <Logo size="md" asLink={false} />
          <p className="text-center text-sm leading-[1.75] text-text-secondary">
            メールアドレスを入力すると、ログイン用のリンクをお送りします。
            パスワードは必要ありません。
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-text-primary"
            >
              メールアドレス
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitted || loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitted || loading}
          >
            {submitted
              ? "送信しました"
              : loading
                ? "送信中…"
                : "マジックリンクを送る"}
          </Button>

          {/* エラー表示 */}
          {errorMessage && (
            <p className="text-center text-sm text-error">{errorMessage}</p>
          )}
        </form>

        {/* 送信後メッセージ（UIプレビュー用） */}
        {submitted && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            入力されたメールアドレスにログイン用のリンクを送りました。
            メールをご確認ください。
          </p>
        )}

        {/* 注釈 */}
        <p className="mt-8 text-center text-xs leading-[1.6] text-text-muted">
          続行することで、
          <Link href="/terms" className="text-primary hover:underline">
            利用規約
          </Link>
          および
          <Link href="/privacy" className="text-primary hover:underline">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>

        {/* トップへ戻る */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-text-secondary transition-colors hover:text-primary"
          >
            ← トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
