import { describe, expect, it } from 'vitest'
import { buildDailyActivity } from './activity'
import type { HistorySnapshot } from '../types/history'

// buildDailyActivity は日次スナップショット群から「その日にいくつレベルが
// 上がったか」を日付ごとに集計する。隣接スナップショット間の差分を使うため、
// 取得漏れで空いた日の成長はまとめて次の取得日に計上される。

function snapshot(date: string, levels: Record<string, number>): HistorySnapshot {
  return {
    date,
    fetchedAt: `${date}T00:00:00Z`,
    characters: Object.entries(levels).map(([name, level]) => ({ name, league: 'Standard', level })),
  }
}

describe('buildDailyActivity', () => {
  it('単一スナップショットは gain 0 の1日を返す', () => {
    expect(buildDailyActivity([snapshot('2026-08-21', { Aoo: 90 })])).toEqual([
      { date: '2026-08-21', gain: 0, playedCharacters: 0 },
    ])
  })

  it('隣接スナップショット間のレベル上昇を後の日の activity に計上する', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-21', { Aoo: 88 }),
      snapshot('2026-08-22', { Aoo: 91 }),
    ])
    expect(result).toEqual([
      { date: '2026-08-21', gain: 0, playedCharacters: 0 },
      { date: '2026-08-22', gain: 3, playedCharacters: 1 },
    ])
  })

  it('複数キャラの上昇を合算し、上がったキャラ数を数える', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-21', { Aoo: 88, Roze: 50, Stun: 60 }),
      snapshot('2026-08-22', { Aoo: 90, Roze: 55, Stun: 60 }),
    ])
    expect(result[1]).toEqual({ date: '2026-08-22', gain: 7, playedCharacters: 2 })
  })

  it('前日にいなかったキャラ (新規作成) は現在レベル全体を当日の gain とする', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-21', { Aoo: 88 }),
      snapshot('2026-08-22', { Aoo: 88, NewChar: 20 }),
    ])
    expect(result[1]).toEqual({ date: '2026-08-22', gain: 20, playedCharacters: 1 })
  })

  it('レベル下降 (データ修正など) は無視する', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-21', { Aoo: 90 }),
      snapshot('2026-08-22', { Aoo: 85 }),
    ])
    expect(result[1]).toEqual({ date: '2026-08-22', gain: 0, playedCharacters: 0 })
  })

  it('3日以上の系列で日ごとの差分を取る', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-21', { Aoo: 80 }),
      snapshot('2026-08-22', { Aoo: 82 }),
      snapshot('2026-08-23', { Aoo: 82 }),
      snapshot('2026-08-24', { Aoo: 86 }),
    ])
    expect(result.map((d) => d.gain)).toEqual([0, 2, 0, 4])
  })

  it('入力の日付順序に関わらず日付昇順で処理する', () => {
    const result = buildDailyActivity([
      snapshot('2026-08-22', { Aoo: 91 }),
      snapshot('2026-08-21', { Aoo: 90 }),
    ])
    expect(result).toEqual([
      { date: '2026-08-21', gain: 0, playedCharacters: 0 },
      { date: '2026-08-22', gain: 1, playedCharacters: 1 },
    ])
  })

  it('空配列は空の結果を返す', () => {
    expect(buildDailyActivity([])).toEqual([])
  })
})
