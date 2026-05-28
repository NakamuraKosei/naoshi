<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Naoshi プロジェクト開発ルール

このプロジェクトは **Naoshi（ナオシ）** — 日本の大学生向け、日本語特化のAIヒューマナイザーWebサービスです。

## 必読ドキュメント（作業前に必ず目を通すこと）

| ファイル | 内容 |
|---|---|
| `requirements.md` | 要件定義書。機能要件・料金プラン・データモデル・マイルストーン |
| `design.md` | デザイン定義。カラー・タイポ・コンポーネント・画面構成 |
| `future-features.md` | 将来機能メモ。MVPスコープ外の機能はここに書く |

### 変換エンジン プロンプト一覧（`prompts/` 配下）

**現行（v4.0体系）— `load-prompt.ts` が参照するファイル:**

| ファイル | 用途 | 備考 |
|---|---|---|
| `humanize-system-prompt-v4.0.md` | 長文変換（500字超） | コピペ対策・主観混入を統合。ダブルチェックの1段階目でも使用 |
| `humanize-system-prompt-short-v4.0.md` | 短文変換（500字以下） | v4.0の短文特化版 |
| `repair-prompt-v1.1.md` | ダブルチェック用修正ループ | ダブルチェックの2段階目。NGワードリスト・文体水準維持を追加 |
| `humanize-business-v1.1.md` | ビジネス長文変換（500字超） | フォーマリティ判定付き。ビジネス版ダブルチェック1段階目でも使用 |
| `humanize-business-short-v1.1.md` | ビジネス短文変換（500字以下） | v1.1の短文特化版。フォーマル度判定・意味保全を追加 |
| `repair-business-v1.1.md` | ビジネス用ダブルチェック修正ループ | ビジネス版の2段階目。NGワードリスト・フォーマル度保護を強化 |

**アーカイブ（旧版・コード未参照）:**

| ファイル | 備考 |
|---|---|
| `humanize-system-prompt-v3.2.md` | v4.0に置き換え済み |
| `humanize-system-prompt-v3.md` | v4.0に置き換え済み |
| `repair-prompt-v1.0.md` | v1.1に置き換え済み |
| `repair-business-v1.0.md` | v1.1に置き換え済み |
| `copyleaks-repair-prompt.md` | repair-v1.0に置き換え済み |
| `humanize-system-prompt-evasion.md` | レガシー。コード未参照 |
| `humanize-system-prompt-short-evasion.md` | レガシー。コード未参照 |
| `humanize-system-prompt-standard.md` | レガシー。コード未参照 |
| `humanize-system-prompt-short-standard.md` | レガシー。コード未参照 |
| `humanize-business-v1.0.md` | v1.1に置き換え済み |
| `humanize-business-short-v1.0.md` | v1.1-shortに置き換え済み |

**現行アーキテクチャ（2モード体制）:**
- **通常モード**: v4.0プロンプトで1回変換（500字以下は短文版を自動選択）
- **ダブルチェックモード**: v4.0変換 → Copyleaks AI検出スキャン → repair-v1.0 指摘箇所修正の3段階（ヘビープラン限定）

## コーディングルール

1. **コードコメントは日本語で書くこと**
2. **変数名・関数名・ファイル名は英語（ケバブケース or キャメルケース）**
3. **変換エンジンのプロンプトは `prompts/` 内のファイルから読み込むこと**（コード内にハードコードしない。500字以下は短文用、それ以上は長文用を自動選択）
4. **Tailwind のカラー・余白は `design.md` のトークンに従うこと**
5. **UIコピーは `design.md` 第9章のトーンに従うこと**（「なおす」「整える」など）

## セキュリティ・機密情報

1. `.env.local` や APIキー・秘密鍵を絶対にコミットしないこと
2. Anthropic API キー、Supabase キー、Stripe キーは必ず環境変数経由で扱うこと
3. ユーザーの入力テキストをログに残さないこと（プライバシー保護）
4. 外部パッケージを追加する際はパッケージ名を報告すること

## 作業フロー

1. 破壊的変更（ファイル削除、大規模リファクタ、依存の大幅変更）の前には**必ず確認を取ること**
2. エージェント並行開発（requirements.md 第11.1章）の担当範囲を守ること
3. 不明点は推測せず、`requirements.md` `design.md` を優先参照する

## 捏造禁止（変換エンジンの絶対ルール）

変換エンジンは学生のレポートを扱う以上、以下を絶対に守ること：

- 事実・数値・体験・固有名詞・参考文献の**捏造・改変は禁止**
- 詳細は `prompts/humanize-system-prompt-v4.0.md` を参照

## MVPスコープ外の機能

以下はMVPに含めない。思いついた機能追加アイデアは `future-features.md` に追記する：

- AI検出チェッカー
- 盗作チェッカー
- PDF/Word入力
- ディープモード（道B）
- Chrome拡張
