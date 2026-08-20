import type { HistorySnapshot } from '../types/history'

export interface LevelPoint {
  date: string
  level: number
}

// buildLevelSeries は履歴スナップショット群から指定キャラのレベル系列を
// 日付昇順で取り出す。該当キャラが記録されていない日は点を作らない
// (存在する日の点だけが並ぶため、欠落日は線がつながる)。
export function buildLevelSeries(snapshots: HistorySnapshot[], name: string): LevelPoint[] {
  return snapshots
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((snap) => {
      const entry = snap.characters.find((c) => c.name === name)
      return entry ? [{ date: snap.date, level: entry.level }] : []
    })
}
