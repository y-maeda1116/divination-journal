import { describe, expect, it } from 'vitest'
import { buildLevelSeries } from './history'
import type { HistorySnapshot } from '../types/history'

function snapshot(
  date: string,
  entries: { name: string; level: number }[],
): HistorySnapshot {
  return {
    date,
    fetchedAt: `${date}T20:17:00Z`,
    characters: entries.map((e) => ({ name: e.name, league: 'Standard', level: e.level })),
  }
}

describe('buildLevelSeries', () => {
  it('該当キャラのレベル系列を日付昇順で返す', () => {
    const snapshots = [
      snapshot('2026-08-18', [{ name: 'MyChar', level: 40 }]),
      snapshot('2026-08-19', [{ name: 'MyChar', level: 41 }]),
      snapshot('2026-08-20', [{ name: 'MyChar', level: 41 }]),
    ]

    expect(buildLevelSeries(snapshots, 'MyChar')).toEqual([
      { date: '2026-08-18', level: 40 },
      { date: '2026-08-19', level: 41 },
      { date: '2026-08-20', level: 41 },
    ])
  })

  it('該当キャラが記録されていない日はデータ点を作らない', () => {
    const snapshots = [
      snapshot('2026-08-18', [{ name: 'MyChar', level: 40 }]),
      snapshot('2026-08-19', [{ name: 'Other', level: 90 }]),
      snapshot('2026-08-20', [{ name: 'MyChar', level: 42 }]),
    ]

    expect(buildLevelSeries(snapshots, 'MyChar')).toEqual([
      { date: '2026-08-18', level: 40 },
      { date: '2026-08-20', level: 42 },
    ])
  })

  it('履歴が無い、または該当キャラが一度も記録されていない場合は空配列', () => {
    expect(buildLevelSeries([], 'MyChar')).toEqual([])
    expect(
      buildLevelSeries([snapshot('2026-08-18', [{ name: 'Other', level: 90 }])], 'MyChar'),
    ).toEqual([])
  })

  it('入力の並び順に関係なく日付昇順にソートする', () => {
    const snapshots = [
      snapshot('2026-08-20', [{ name: 'MyChar', level: 42 }]),
      snapshot('2026-08-18', [{ name: 'MyChar', level: 40 }]),
    ]

    expect(buildLevelSeries(snapshots, 'MyChar')).toEqual([
      { date: '2026-08-18', level: 40 },
      { date: '2026-08-20', level: 42 },
    ])
  })
})
