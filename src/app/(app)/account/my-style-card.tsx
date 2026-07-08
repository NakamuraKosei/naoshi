"use client";

// マイ文体（文体プロファイル）の登録カード。ヘビープラン限定でマイページに表示。
// 自分で書いたレポートを貼ると、システムが文体の癖を解析してプロファイル化する。
// プライバシー: 本文は解析後に破棄され、抽象化した特徴のみ保存される。

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// サンプルの最低文字数（API側と揃える）
const MIN_SAMPLE_CHARS = 1000;

type ProfileState = {
  registered: boolean;
  features: string[];
  sampleChars?: number;
  updatedAt?: string;
};

export function MyStyleCard() {
  // null = 読み込み中
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [sample, setSample] = useState("");
  // 登録済みでも「登録し直す」で入力フォームを開けるようにする
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/style-profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProfileState | null) => {
        if (cancelled) return;
        setProfile(data ?? { registered: false, features: [] });
      })
      .catch(() => {
        if (!cancelled) setProfile({ registered: false, features: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sampleLength = sample.trim().length;

  async function handleRegister() {
    if (sampleLength < MIN_SAMPLE_CHARS) return;
    setAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/style-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sample.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        registered?: boolean;
        features?: string[];
        sampleChars?: number;
        error?: string;
      };
      if (!res.ok) {
        setErrorMessage(data.error ?? "解析に失敗しました。もう一度お試しください。");
        return;
      }
      setProfile({
        registered: true,
        features: data.features ?? [],
        sampleChars: data.sampleChars,
      });
      setSample("");
      setEditing(false);
      setJustRegistered(true);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("登録した文体プロファイルを削除しますか？")) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/style-profile", { method: "DELETE" });
      if (!res.ok) {
        setErrorMessage("削除に失敗しました。");
        return;
      }
      setProfile({ registered: false, features: [] });
      setJustRegistered(false);
    } catch {
      setErrorMessage("通信エラーが発生しました。");
    } finally {
      setDeleting(false);
    }
  }

  // 読み込み中は何も出さない（ちらつき防止）
  if (profile === null) return null;

  const showForm = !profile.registered || editing;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>マイ文体</CardTitle>
        <CardDescription>
          <span className="block">
            あなたが自分で書いたレポートから文章の癖を学び、変換結果をあなたの文体に寄せます。
          </span>
          <span className="mt-1 block text-text-muted">
            貼り付けた本文は解析後に破棄され、保存されません。
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 登録済み表示 */}
        {profile.registered && !editing && (
          <div className="space-y-4">
            {justRegistered && (
              <p className="text-sm text-[#10B981]">
                文体を登録しました。変換画面の「自分の文体」をONにすると反映されます。
              </p>
            )}
            <div>
              <p className="mb-2 text-sm font-medium text-text-primary">
                読み取れたあなたの文体の特徴
              </p>
              <ul className="flex flex-wrap gap-2">
                {profile.features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full bg-primary-lighter px-3 py-1 text-xs text-text-secondary"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                登録し直す
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-text-muted underline-offset-2 hover:text-[#EF4444] hover:underline disabled:opacity-50"
              >
                {deleting ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        )}

        {/* 登録フォーム（未登録 or 登録し直し） */}
        {showForm && (
          <div className="space-y-3">
            <div className="space-y-1 text-sm text-text-secondary">
              <p>
                <span className="font-medium text-text-primary">AIを使わずに、あなた自身が書いた</span>
                レポートやエッセイを貼り付けてください（{MIN_SAMPLE_CHARS.toLocaleString()}字以上）。
              </p>
              <p className="text-text-muted">
                ※ AIが書いた文章を貼ると、AIの癖を学んでしまうためご注意ください。
              </p>
            </div>
            <textarea
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              rows={8}
              placeholder="ここに自分で書いたレポートを貼り付けてください。"
              disabled={analyzing}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-[1.75] text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="自分で書いたレポートの貼り付け"
            />
            {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}
            <div className="flex items-center justify-between">
              <span
                className={
                  sampleLength > 0 && sampleLength < MIN_SAMPLE_CHARS
                    ? "text-xs text-[#EF4444] tabular-nums"
                    : "text-xs text-text-muted tabular-nums"
                }
              >
                {sampleLength.toLocaleString()} / {MIN_SAMPLE_CHARS.toLocaleString()} 字以上
              </span>
              <div className="flex items-center gap-3">
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setSample("");
                      setErrorMessage(null);
                    }}
                    disabled={analyzing}
                    className="text-xs text-text-muted underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRegister}
                  disabled={analyzing || sampleLength < MIN_SAMPLE_CHARS}
                >
                  {analyzing ? "解析中…（30秒ほど）" : "文体を解析して登録"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
