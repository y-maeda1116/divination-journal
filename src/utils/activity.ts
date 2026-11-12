import type { HistorySnapshot } from '../types/history'

export interface DailyActivity {
  date: string
  // その日の全キャラ合計レベル上昇量 (正の差分のみ)
  gain: number
  // レベルが上がったキャラ数
  playedCharacters: number
}

// buildDailyActivity は日次スナップショット群から日付ごとのプレイ量
// (レベル上昇) を集計する。隣接スナップショット間の差分を使うため、
// 取得漏れで空いた日の成長はまとめて次の取得日に計上される。
export function buildDailyActivity(snapshots: HistorySnapshot[]): DailyActivity[] {
  const sorted = snapshots.slice().sort((a, b) => a.date.localeCompare(b.date))

  return sorted.map((snap, i) => {
    if (i === 0) {
      return { date: snap.date, gain: 0, playedCharacters: 0 }
    }

    const prevLevels = new Map(
      sorted[i - 1].characters.map((c) => [c.name, c.level] as const),
    )

    let gain = 0
    let playedCharacters = 0
    for (const char of snap.characters) {
      // 前日にいなかったキャラ (新規作成) はレベル 0 から始まったとみなす
      const delta = char.level - (prevLevels.get(char.name) ?? 0)
      if (delta > 0) {
        gain += delta
        playedCharacters += 1
      }
    }

    return { date: snap.date, gain, playedCharacters }
  })
}
