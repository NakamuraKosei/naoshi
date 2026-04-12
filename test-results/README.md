# Naoshi 品質検証テスト結果

このディレクトリは `requirements.md` 第11.0章に定める **AI検出通過テスト** と **Turnitin実地テスト** の結果を記録する場所です。

---

## 目的

Naoshiの変換エンジン品質を定量的に検証し、`prompts/humanize-system-prompt.md` のチューニングに反映するための記録を残します。

- **M4フェーズ**: 内部検証（GPTZero / Copyleaks / ZeroGPT）
- **M5フェーズ**: Turnitin実地テスト

---

## ディレクトリ構成

```
test-results/
├── README.md                    ← このファイル
├── template.md                  ← 1サンプル分の記録テンプレート（コピーして使う）
├── samples/                     ← 入力サンプル（匿名化済み）
│   ├── gitignore                  実入力はコミット禁止
├── m4-YYYY-MM-DD/               ← M4実施日ごとのフォルダ
│   ├── summary.md                 サマリ（合格基準達成率）
│   └── s01.md 〜 s15.md           各サンプルの記録
└── m5-YYYY-MM-DD/               ← M5（Turnitin）実施日ごとのフォルダ
    ├── summary.md
    └── s01.md 〜
```

---

## サンプル設計（M4で15本）

| # | 生成元AI | 文量 | テーマ例 |
|---|---|---|---|
| s01 | ChatGPT | 短文（〜800字） | 環境問題 |
| s02 | ChatGPT | 短文 | 経済 |
| s03 | ChatGPT | 中文（800〜2000字） | 教育 |
| s04 | ChatGPT | 中文 | 技術 |
| s05 | ChatGPT | 長文（2000字〜） | 社会学 |
| s06 | Claude | 短文 | 歴史 |
| s07 | Claude | 短文 | 哲学 |
| s08 | Claude | 中文 | 法律 |
| s09 | Claude | 中文 | 医療 |
| s10 | Claude | 長文 | 国際関係 |
| s11 | Gemini | 短文 | 文学 |
| s12 | Gemini | 短文 | 心理 |
| s13 | Gemini | 中文 | 経営 |
| s14 | Gemini | 中文 | 情報科学 |
| s15 | Gemini | 長文 | 政治 |

※ テーマは例。実際は協力者のレポートを匿名化して使用可。

---

## 合格基準

### M4（requirements.md 11.0.1）
**「Human-written」判定または「AI確率40%以下」のサンプルが80%以上（15本中12本以上）**

達成しない場合は `prompts/humanize-system-prompt.md` をチューニングし、再検証。

### M5（requirements.md 11.0.2）
**Turnitinで「AI確率30%以下」を70%以上のサンプルで達成**

---

## プライバシー配慮

- 実入力テキストは `samples/` 配下に置き、**gitignore済み**
- 記録ファイル（`s01.md` 等）には**匿名化した要約のみ**を残す
- 協力者が特定される固有名詞は記載しない

---

## 運用サイクル

- AI検出サービスは頻繁にアップデートされるため、**月1回** の定期再検証を推奨
- プロンプト更新時は必ず再検証し、結果を履歴として残す
