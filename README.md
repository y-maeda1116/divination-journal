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

Go製CLIツールでPoE公式APIからキャラクター・リーグデータを取得します。認証には公式の **OAuth2 API**（`api.pathofexile.com`）を使います。旧来の POESESSID 方式（character-window API）は新しいアカウントでは利用できないため廃止しました。

### 事前準備: OAuth2 アプリの登録

1. [Developer Docs](https://www.pathofexile.com/developer/docs) を確認し、GGG に developer project の登録を申請して `client_id` を取得します（承認制のため時間がかかる可能性があります）
2. 登録時の redirect URI には `http://127.0.0.1:14500/callback` を指定してください（CLI がローカルで待ち受けるアドレスです）

### 認証と refresh token の取得

```bash
cd scripts/fetch-poe-data
go run . auth --client-id=YourClientID
```

表示された URL をブラウザで開いて認可すると、ターミナルに **refresh token** が出力されます。

> **重要**: refresh token は最長 **7日** で失効します（OAuth2 の仕様上、延長不可）。**週1回程度は再認証して Secret を更新する** 運用が必要です。

### GitHub Secrets の設定

リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で以下2つを設定します：

| Secret 名 | 値 |
|-----------|-----|
| `POE_CLIENT_ID` | 登録した OAuth2 アプリの client_id |
| `POE_REFRESH_TOKEN` | `auth` サブコマンドで取得した refresh token |

### 定期実行

毎日 **JST 05:17（UTC 20:17）** に自動実行されます（GitHub Actions の `schedule`）。手動実行も可能です：

**Actions → "Fetch PoE Data" → Run workflow**

> GitHub Actions の cron は負荷時に遅延します。また、リポジトリが60日間非アクティブだと scheduled workflow が自動停止されるため、その場合は Actions ページから再有効化してください。

### 失敗時の通知

ワークフローが失敗すると、ジョブサマリーに原因の見当づき（refresh token 期限切れ・Secrets 未設定・レート制限）と実行ログの URL が出力されます。メール通知を受け取るには https://github.com/settings/notifications → **Email** → **Actions** を有効化してください。

### ローカル実行

```bash
cd scripts/fetch-poe-data
go run . fetch --client-id=YourClientID --refresh-token=YourRefreshToken --output-dir=../../content
```

### トラブルシューティング

| 症状 | 対処 |
|------|------|
| `oauth token request failed` / `Token refresh failed` | refresh token が期限切れ。`go run . auth` を再実行して Secret を更新 |
| `authentication failed: access token may be expired` | アクセストークン拒否。上記と同様に再認証 |
| `status 403` | スコープ不足またはレート制限の可能性。時間をおいて再実行 |
| scheduled workflow が発火しない | 60日非アクティブで停止している可能性。Actions ページから再有効化 |

## Deploy

mainブランチへのpushで自動的にGitHub Pagesにデプロイされます。
