---
name: プロジェクトコンテキスト
description: Naoshi（ナオシ）の背景情報と技術スタック
type: context
---

## プロジェクト概要
- サービス名: Naoshi（ナオシ）
- 概要: 日本の大学生向け、日本語特化のAIテキスト人間化（ヒューマナイザー）Webサービス。AIで書いたレポートを自然な日本語に書き換える。
- ターゲット: 日本の大学生（学部1〜4年）／大学院生／専門学校生／社会人レポート

## MVP機能
- 変換エンジン（ノーマルモードのみ、だ・である調 / ですます調 切替）
- Supabase Auth（Email Magic Link）
- Stripe課金（無料 / ライト週500円 / ヘビー月2,980円 / ヘビー年24,000円）
- 利用回数カウンタ・履歴表示（最新10件）
- 法的ページ（利用規約 / プライバシー / 特商法）

## 技術スタック
- Next.js 14+（App Router）/ TypeScript / Tailwind CSS
- Supabase（Auth + Postgres + RLS）
- Anthropic Claude Sonnet 4 API（`@anthropic-ai/sdk`）
- Stripe Checkout / Customer Portal / Webhook
- Vercel ホスティング

## 重要ファイル
- `CLAUDE.md` / `AGENTS.md`: プロジェクト開発ルール
- `requirements.md`: 要件定義書
- `design.md`: デザイン定義
- `prompts/humanize-system-prompt.md`: 変換エンジンのシステムプロンプト本体
- `future-features.md`: スコープ外機能メモ

## 関係者
- **ラボ**: プロジェクト管理・開発
