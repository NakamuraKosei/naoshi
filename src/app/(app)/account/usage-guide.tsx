"use client";

// マイページの「使い方」ガイド（折りたたみ式）
// マイページが縦に長くなりすぎないよう、デフォルトは閉じておき
// 「使い方を見る」を押したときだけ展開する。

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// 各項目の説明（シンプルに）
const GUIDE_ITEMS: { title: string; body: string; plan?: string }[] = [
  {
    title: "基本の使い方",
    body: "「なおす」画面でAIが書いた文章を貼り付け、「なおす」ボタンを押すと、自然な日本語に整えた文章が右側に表示されます。出力はそのまま編集したり、コピーしたりできます。",
  },
  {
    title: "文体の切り替え（だ・である調／です・ます調）",
    body: "「なおす」画面の上部で文体を選べます。レポートなら「だ・である調」、案内文やメールなら「です・ます調」がおすすめです。カテゴリ（レポート／ビジネス）に応じて既定の文体が自動で選ばれます。",
  },
  {
    title: "高精度モード",
    plan: "ヘビープラン",
    body: "通常よりも高性能なモデルを使い、AIっぽさをさらに抑えて書き換えます。仕上がりの精度が上がる分、処理に少し時間がかかり、消費文字数は通常の3倍になります。精度を重視したいときにONにしてください。",
  },
  {
    title: "マイ文体",
    plan: "ヘビープラン",
    body: "自分で書いたレポートを1つ登録すると、その文章の癖を学習し、変換結果をあなたの文体に寄せます。登録はこのマイページの「マイ文体」から。登録後、「なおす」画面に表示される「マイ文体」をONにすると反映されます。※AIを使わずに自分で書いた文章を登録してください。",
  },
];

export function UsageGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>使い方</CardTitle>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {open ? "閉じる" : "使い方を見る"}
          </button>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <ul className="space-y-5">
            {GUIDE_ITEMS.map((item) => (
              <li key={item.title}>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                  {item.plan && (
                    <span className="rounded-full bg-primary-lighter px-2 py-0.5 text-xs text-primary">
                      {item.plan}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-[1.8] text-text-secondary">{item.body}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
