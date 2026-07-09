"use client";

// マイページの常設フィードバック欄（任意送信）
// 変換直後以外のタイミング（不具合報告・要望など）の受け皿。
// 送信先は既存の /api/feedback（DB保存＋運営へメール通知）を再利用する。

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MAX_LENGTH = 1000;

export function FeedbackCard() {
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length === 0) return;
    setSending(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMessage(data.error ?? "送信に失敗しました。もう一度お試しください。");
        return;
      }
      setSent(true);
      setComment("");
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ご意見・ご要望</CardTitle>
        <CardDescription>
          不具合のご報告や機能のご要望など、お気軽にお寄せください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-[#10B981]">
            送信しました。ありがとうございます！
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              placeholder="例：変換結果の語尾が不自然だった／こんな機能が欲しい など"
              disabled={sending}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-[1.75] text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="ご意見・ご要望"
            />
            {errorMessage && (
              <p className="text-sm text-error">{errorMessage}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted tabular-nums">
                {comment.length} / {MAX_LENGTH} 字
              </span>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={sending || comment.trim().length === 0}
              >
                {sending ? "送信中…" : "送信する"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
