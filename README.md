<<<<<<< HEAD
# TypeScript Template Base

A cross-platform TypeScript template repository optimized for Node.js tool development with consideration for future web frontend (React) migration.

## Features

- TypeScript with strict mode
- Hot-reload development with `tsx`
- Dual CJS/ESM build with `tsup`
- Testing with Vitest
- Linting with ESLint (flat config)
- Formatting with Prettier
- Environment variable validation with Zod
- CI/CD with GitHub Actions (Ubuntu, Windows, macOS)

## Requirements

- Node.js >= 20.0.0
- npm

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` with your actual values:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DEEPL_AUTH_KEY=your_deepl_auth_key_here
```

## Development

Run in development mode with hot-reload:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Build

Build for production:

```bash
npm run build
```

Run built files:

```bash
npm start
```

## Linting and Formatting

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

## Environment Variables

The following environment variables are required (customize for your project):

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord bot token (example) |
| `DEEPL_AUTH_KEY` | DeepL API key (example) |

## License

MIT
=======
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

masterブランチへのpushで自動的にGitHub Pagesにデプロイされます。
>>>>>>> 20555e3 (feat: initial PoE diary tool implementation)
