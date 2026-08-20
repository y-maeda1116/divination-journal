import { describe, expect, it } from 'vitest'
import { classDistribution, leagueSummary, levelHistogram } from './stats'
import type { Character } from '../types/character'
import type { League } from '../types/league'

function character(partial: Partial<Character>): Character {
  return {
    name: 'Unnamed',
    league: 'Standard',
    class: 'Necromancer',
    ascendancy: '',
    level: 80,
    experience: 1000000,
    fetchedAt: '2026-08-17T00:00:00Z',
    ...partial,
  }
}

function league(partial: Partial<League>): League {
  return {
    id: 'Standard',
    realm: 'pc',
    url: '',
    startAt: null,
    endAt: null,
    characters: [],
    ...partial,
  }
}

describe('classDistribution', () => {
  it('基礎クラスごとに集計し、件数降順・同数は名前昇順で返す', () => {
    const chars = [
      character({ name: 'A', class: 'Necromancer' }),
      character({ name: 'B', class: 'Elementalist' }),
      character({ name: 'C', class: 'Juggernaut' }),
      character({ name: 'D', class: 'Trickster' }),
    ]

    expect(classDistribution(chars)).toEqual([
      { baseClass: 'Witch', count: 2 },
      { baseClass: 'Marauder', count: 1 },
      { baseClass: 'Shadow', count: 1 },
    ])
  })

  it('空配列なら空の分布を返す', () => {
    expect(classDistribution([])).toEqual([])
  })
})

describe('levelHistogram', () => {
  it('10 刻みの bin に集計し、空 bin も 0 で返す', () => {
    const bins = levelHistogram([
      character({ level: 5 }),
      character({ level: 42 }),
      character({ level: 100 }),
    ])

    expect(bins).toHaveLength(11)
    expect(bins[0]).toEqual({ range: '1-9', count: 1 })
    expect(bins[4]).toEqual({ range: '40-49', count: 1 })
    expect(bins[10]).toEqual({ range: '100', count: 1 })
    expect(bins[1]).toEqual({ range: '10-19', count: 0 })
  })

  it('境界レベルは正しい bin に入る', () => {
    const bins = levelHistogram([
      character({ level: 1 }),
      character({ level: 9 }),
      character({ level: 10 }),
      character({ level: 99 }),
      character({ level: 100 }),
    ])

    expect(bins[0].count).toBe(2) // 1, 9 → 1-9
    expect(bins[1].count).toBe(1) // 10 → 10-19
    expect(bins[9].count).toBe(1) // 99 → 90-99
    expect(bins[10].count).toBe(1) // 100 → 100
  })

  it('空配列なら全 bin が 0', () => {
    const bins = levelHistogram([])

    expect(bins).toHaveLength(11)
    expect(bins.every((b) => b.count === 0)).toBe(true)
  })
})

describe('leagueSummary', () => {
  it('常設/イベントを区別しキャラ数を数える', () => {
    const chars = [
      character({ league: 'Standard' }),
      character({ league: 'Standard' }),
      character({ league: 'Settlers' }),
    ]
    const leagues = [
      league({ id: 'Standard', startAt: null }),
      league({ id: 'Settlers', startAt: '2026-08-01T00:00:00Z' }),
    ]

    const views = leagueSummary(chars, leagues)

    expect(views.map((v) => [v.id, v.characterCount, v.isPermanent])).toEqual([
      ['Standard', 2, true],
      ['Settlers', 1, false],
    ])
  })

  it('leagues JSON に無いリーグもキャラから導出する', () => {
    const views = leagueSummary([character({ league: 'Hardcore' })], [])

    expect(views).toHaveLength(1)
    expect(views[0]).toMatchObject({ id: 'Hardcore', characterCount: 1, isPermanent: true })
  })
})
