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

Go製CLIツールでPoE公式APIからキャラクター・リーグデータを取得します。認証には公式サイトのログインセッション（POESESSID）を使います。

### POESESSID の取得手順

1. ブラウザで https://www.pathofexile.com にログインする
2. 開発者ツール（F12）を開き、**Application**（Chrome）または **Storage**（Firefox）→ **Cookies** → `https://www.pathofexile.com` を選ぶ
3. `POESESSID` の値をコピーする

> **注意**: ログアウトすると POESESSID は無効化されます。ブラウザのタブを閉じるだけにしてください。また GGG 側で定期的にローテーションされるため、期限切れになったら再取得が必要です。

### GitHub Secrets の設定

リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で以下2つを設定します：

| Secret 名 | 値 |
|-----------|-----|
| `POE_ACCOUNT_NAME` | PoE のアカウント名 |
| `POESESSID` | 上記で取得した POESESSID |

### 定期実行

毎日 **JST 05:17（UTC 20:17）** に自動実行されます（GitHub Actions の `schedule`）。手動実行も可能です：

**Actions → "Fetch PoE Data" → Run workflow**

> GitHub Actions の cron は負荷時に遅延します。また、リポジトリが60日間非アクティブだと scheduled workflow が自動停止されるため、その場合は Actions ページから再有効化してください。

### 失敗時の通知

ワークフローが失敗すると、ジョブサマリーに原因の見当づき（POESESSID 期限切れ・Secrets 未設定・IPブロック）と実行ログの URL が出力されます。メール通知を受け取るには https://github.com/settings/notifications → **Email** → **Actions** を有効化してください。

### ローカル実行

```bash
cd scripts/fetch-poe-data
go run . --account=YourAccountName --poesessid=YourPOESESSID --output-dir=../../content
```

### トラブルシューティング

| 症状 | 対処 |
|------|------|
| `authentication failed: POESESSID may be expired` | POESESSID が期限切れ。再取得して Secret を更新 |
| `status 403` | GGG のIPブロック/レート制限の可能性。時間をおいて再実行 |
| scheduled workflow が発火しない | 60日非アクティブで停止している可能性。Actions ページから再有効化 |

## Deploy

mainブランチへのpushで自動的にGitHub Pagesにデプロイされます。
