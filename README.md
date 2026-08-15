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

Go製CLIツールでPoE公式APIからキャラクター・リーグデータを取得します。

> ### 📌 現状（2026-08 時点）
>
> | 項目 | 状態 |
> |------|------|
> | POESESSID 経路（主） | ✅ **動作確認済み** — accountName を表示名の `名前#数字` 形式（例: `taityon#0728`）で指定すると取得できる。URL 用スラッグ形式（例: `taityon-0728`）では Permission Denied になる（詳細は下記） |
> | OAuth2 経路（フォールバック） | ⏳ **実装済み・client_id 未取得** — GGG への developer project 申請（承認制）が必要。POESESSID で取得できている間は不要 |
> | 自動取得（毎日 JST 05:17） | ✅ `POE_ACCOUNT_NAME` を `名前#数字` 形式に設定すれば POESESSID 経路で動作する |

取得は2経路のハイブリッド構成です:

1. **主経路: POESESSID**（旧 character-window API・申請不要）
2. **フォールバック経路: OAuth2 API**（`api.pathofexile.com`・申請必要）

新しいアカウントシステムでは、accountName に URL スラッグ形式（`名前-数字`）を指定すると POESESSID 経路が拒否されるため、**表示名（`名前#数字`）を指定する**必要があります。それでも失敗する場合（POESESSID 失効・GGG 側の仕様変更など）は自動的に OAuth2 へフォールバックします。

### POESESSID の取得手順（主経路）

1. ブラウザで https://www.pathofexile.com にログインする
2. 開発者ツール（F12）を開き、**Application**（Chrome）または **Storage**（Firefox）→ **Cookies** → `https://www.pathofexile.com` を選ぶ
3. `POESESSID` の値をコピーする

> **重要: アカウント名は「表示名（`#` 形式）」を使う**。新アカウントシステムのアカウントは、URL 用のスラッグ形式（例: `taityon-0728`）を `accountName` に指定すると API が **Permission Denied** を返す。サイト右上に表示される表示名（例: `taityon#0728`）をそのまま指定すると取得できる（2026-08 に動作確認済み）。

> **注意**: ログアウトすると POESESSID は無効化されます。ブラウザのタブを閉じるだけにしてください。また GGG 側で定期的にローテーションされるため、期限切れになったら再取得が必要です。

### OAuth2 の準備（フォールバック経路）

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

リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で設定します（主経路・フォールバック経路のどちらか一方だけでも動作します）：

| Secret 名 | 値 | 経路 |
|-----------|-----|------|
| `POE_ACCOUNT_NAME` | PoE のアカウント名（**表示名の `名前#数字` 形式**。例: `taityon#0728`） | 主（POESESSID） |
| `POESESSID` | 上記で取得した POESESSID | 主（POESESSID） |
| `POE_CLIENT_ID` | 登録した OAuth2 アプリの client_id | フォールバック（OAuth2） |
| `POE_REFRESH_TOKEN` | `auth` サブコマンドで取得した refresh token | フォールバック（OAuth2） |

### 定期実行

毎日 **JST 05:17（UTC 20:17）** に自動実行されます（GitHub Actions の `schedule`）。手動実行も可能です：

**Actions → "Fetch PoE Data" → Run workflow**

> GitHub Actions の cron は負荷時に遅延します。また、リポジトリが60日間非アクティブだと scheduled workflow が自動停止されるため、その場合は Actions ページから再有効化してください。

### 失敗時の通知

ワークフローが失敗すると、ジョブサマリーに原因の見当づき（POESESSID 拒否・refresh token 期限切れ・Secrets 未設定・レート制限）と実行ログの URL が出力されます。メール通知を受け取るには https://github.com/settings/notifications → **Email** → **Actions** を有効化してください。

### ローカル実行

```bash
cd scripts/fetch-poe-data
# 主経路（POESESSID）
go run . fetch --account=YourAccountName --poesessid=YourPOESESSID --output-dir=../../content
# フォールバック経路（OAuth2）
go run . fetch --client-id=YourClientID --refresh-token=YourRefreshToken --output-dir=../../content
```

### トラブルシューティング

| 症状 | 対処 |
|------|------|
| `POESESSID method failed` で Permission Denied | `POE_ACCOUNT_NAME` が URL スラッグ形式（`名前-数字`）の可能性。表示名の `名前#数字` 形式に変更する |
| `oauth token request failed` / `Token refresh failed` | refresh token が期限切れ。`go run . auth` を再実行して Secret を更新 |
| `authentication failed: access token may be expired` | アクセストークン拒否。上記と同様に再認証 |
| `status 403` | スコープ不足またはレート制限の可能性。時間をおいて再実行 |
| scheduled workflow が発火しない | 60日非アクティブで停止している可能性。Actions ページから再有効化 |

## Deploy

mainブランチへのpushで自動的にGitHub Pagesにデプロイされます。
