# PoE Diary Tool - Design Spec

## Overview

Path of Exileのプレイデータを記録・表示する静的Webアプリケーション。React + TypeScript + Viteで構築し、GitHub Pagesで公開。データベースを使わず、リポジトリ内のJSON/Markdownファイルをデータソースとする。

## Requirements

### Must Have
- キャラクタービルド・進捗の表示
- 倉庫/アイテム管理（Phase 2）
- シーズン/リーグ履歴
- PoE公式APIからのデータ取得（GitHub Actions + Go）
- Markdown日記エントリの表示
- PoE風ダークテーマ
- GitHub Pagesでのホスティング

### Phase 2 (Later)
- POESESSIDを使ったスタッシュデータ取得
- 倉庫タブUI
- アイテムフィルタリング

## Architecture

### Directory Structure

```
poe-diary/
├── src/                          # React + Vite フロントエンド
│   ├── components/
│   │   ├── layout/               # Header, Sidebar, TabNav
│   │   ├── dashboard/            # Dashboard (ホーム画面)
│   │   ├── characters/           # キャラクター一覧・詳細
│   │   ├── stash/                # 倉庫アイテム (Phase 2)
│   │   ├── leagues/              # リーグ履歴
│   │   └── diary/                # Markdown日記
│   ├── data/                     # 静的JSON (ビルド時にimport)
│   ├── hooks/                    # カスタムフック
│   ├── types/                    # TypeScript型定義
│   ├── utils/                    # ユーティリティ
│   └── App.tsx
├── content/
│   ├── characters/               # キャラクターデータJSON
│   ├── leagues/                  # リーグ履歴JSON
│   ├── diary/                    # Markdown日記エントリ
│   │   ├── 2026-04/
│   │   │   ├── 01-league-start.md
│   │   │   └── 03-first-boss.md
│   │   └── ...
│   └── stash/                    # スタッシュデータ (Phase 2)
├── scripts/
│   └── fetch-poe-data/           # Go製データ取得ツール
│       ├── main.go
│       ├── api/
│       ├── models/
│       └── go.mod
└── .github/
    └── workflows/
        └── fetch-data.yml        # 手動トリガー用GitHub Actions
```

### Data Flow

1. `workflow_dispatch` でGoスクリプトがPoE APIからデータ取得
2. `content/` ディレクトリにJSONとして保存
3. 変更をコミット & push
4. pushトリガーでViteビルド → GitHub Pagesへデプロイ
5. ビルド時にJSON/Markdownファイルを静的インポート

### UI Design

#### Color Palette (PoE Dark Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| bg-primary | `#0a0a0f` | ページ背景 |
| bg-card | `#12121a` | カード・パネル背景 |
| accent | `#af6025` | PoEオレンジ/ゴールド |
| accent-green | `#4a7c59` | 成功・達成 |
| text-primary | `#d4c5a9` | パーチメント風メインテキスト |
| text-muted | `#6b6b7b` | 補助テキスト |
| rarity-rare | `#7777ff` | レアアイテム |
| rarity-unique | `#af6025` | ユニークアイテム |
| rarity-currency | `#aa9e82` | カレンシー |

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  Header: PoE Diary  [Dashboard][Char][League][Diary] │
├──────────┬───────────────────────────────────────────┤
│ Sidebar  │  Main Content Area                        │
│ リーグ切替│                                           │
│ 最近更新  │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

#### Tabs

- **Dashboard**: アクティブキャラ概要、最近の更新、最新日記3件
- **Characters**: キャラクター一覧 → クリックで詳細（ビルド情報、装備、レベル推移グラフ）
- **Leagues**: リーグごとのサマリー、目標達成状況、使用ビルド履歴
- **Diary**: Markdown記事一覧（年月フォルダ構成）、個別記事表示

### Go Data Fetcher

#### Structure

```
scripts/fetch-poe-data/
├── main.go              # エントリポイント
├── api/
│   └── client.go        # PoE API クライアント
├── models/
│   ├── character.go     # キャラクター型
│   ├── league.go        # リーグ型
│   └── item.go          # アイテム型 (Phase 2)
└── output/
    └── writer.go        # JSON/Markdown出力
```

#### CLI Interface

```
fetch-poe-data --account=<account> --league=<league> --output-dir=../../content
```

#### PoE API Endpoints (Phase 1 - Public)

- `GET /character-window/get-characters?accountName=<name>` - キャラクター一覧
- `GET /character-window/get-items?accountName=<name>&character=<char>` - キャラ詳細・装備
- `GET /league` - リーグ一覧

#### Output Format

`content/characters/{character-name}.json`:
```json
{
  "name": "CharacterName",
  "league": "Standard",
  "class": "Witch",
  "level": 95,
  "experience": 1234567890,
  "fetchedAt": "2026-04-03T10:00:00Z",
  "items": { ... },
  "passives": { ... }
}
```

`content/leagues/{league-name}.json`:
```json
{
  "id": "Affliction",
  "realm": "pc",
  "url": "https://www.pathofexile.com/league/affliction",
  "startAt": "2026-04-01T00:00:00Z",
  "endAt": null,
  "characters": ["CharA", "CharB"]
}
```

### GitHub Actions Workflow

```yaml
name: Fetch PoE Data
on:
  workflow_dispatch:
    inputs:
      account:
        description: 'PoE Account Name'
        required: true
      league:
        description: 'League Name'
        required: false
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.23'
      - run: go run ./scripts/fetch-poe-data --account=${{ inputs.account }} --league=${{ inputs.league }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update PoE data"
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Routing | Hash-based tab switching (state only) |
| Markdown | react-markdown + remark-gfm |
| Charts | recharts (level progression) |
| Data Fetcher | Go 1.23+ |
| Deploy | GitHub Pages (gh-pages branch) |
| CI/CD | GitHub Actions |

### Content Format - Diary Entries

MarkdownファイルにYAML frontmatterを付与:

```markdown
---
title: "リーグ開始！ビルド決定"
date: 2026-04-01
league: "Affliction"
character: "NecroBlast"
tags: ["league-start", "build"]
---

今日のプレイ内容...
```

日記ファイルは `content/diary/YYYY-MM/` に配置。
