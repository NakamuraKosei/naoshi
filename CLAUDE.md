@AGENTS.md

# CLAUDE.md — Naoshi プロジェクト設定

最終更新日: 2026-05-16
バージョン: 0.2

---

## プロジェクト概要

**Naoshi（ナオシ）** — 日本の大学生向け、日本語特化のAIテキスト人間化（ヒューマナイザー）Webサービス。

## 変換エンジン

変換エンジンのプロンプトは `prompts/` 配下のファイルが正（source of truth）。
CLAUDE.md にプロンプト本文は含めない。詳細は `AGENTS.md` のプロンプト一覧を参照。

**最重要ルール: 捏造禁止**
- 事実・数値・体験・固有名詞・参考文献の改変・捏造は絶対禁止
- 詳細は `prompts/humanize-system-prompt-v3.md` 第1章

---

## MVP機能スコープ

- 変換エンジン（だ・である調 / ですます調 切替）
- Supabase Auth（Email Magic Link）
- Stripe課金（無料 / ライト週500円 / ヘビー月2,980円 / ヘビー年24,000円）
- 利用回数カウンタ・履歴（最新10件）
- 法的ページ（利用規約・プライバシー・特商法）

## 技術スタック

- Next.js 16 App Router / TypeScript / Tailwind CSS
- Supabase（Auth + Postgres）
- Anthropic Claude Sonnet 4 API（`@anthropic-ai/sdk`）
- Stripe Checkout / Customer Portal / Webhook
- Vercel ホスティング

詳細は `requirements.md` `design.md` `future-features.md` を参照。

---

## コーディングルール

- コードコメントは日本語
- `.env.local` などの機密情報はコミットしない
- ファイル削除や破壊的操作の前に必ず確認を取る

## バージョン履歴

- **v0.1（2026-04-11）**: MVP向け初版。プロンプト全文を含む構成
- **v0.2（2026-05-16）**: プロンプト全文を `prompts/` に委譲。プロジェクト設定に特化。Next.js 16に更新。変換エンジン2モード体制（普通/AI対策）を反映
