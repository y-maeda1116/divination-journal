# PoE Diary

Path of Exileのプレイデータを記録・表示する静的Webアプリケーション。

## Features

- キャラクタービルド・進捗の表示
- シーズン/リーグ履歴と目標達成トラッキング
- Markdown形式のプレイ日記
- PoE公式APIからのデータ取得（GitHub Actions）
- PoE風ダークテーマ

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Go (データ取得ツール)
- GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Content Structure

```
content/
├── characters/       # キャラクターデータ JSON
├── leagues/          # リーグ情報 JSON
└── diary/
    └── YYYY-MM/      # 年月ごとの日記 Markdown
```

### Diary Entry Format

```markdown
---
title: "エントリタイトル"
date: 2026-04-01
league: "Affliction"
character: "CharacterName"
tags: ["tag1", "tag2"]
---

本文...
```

## Data Fetching

Go製CLIツールでPoE APIからキャラクター・リーグデータを取得：

```bash
cd scripts/fetch-poe-data
go run . --account=YourAccountName --output-dir=../../content
```

### GitHub Actions

手動トリガーでデータ更新：

1. リポジトリの **Settings → Secrets → Actions** に `POE_ACCOUNT_NAME` を設定
2. **Actions → "Fetch PoE Data" → Run workflow** を実行

## Deploy

mainブランチへのpushで自動的にGitHub Pagesにデプロイされます。
