import { describe, expect, it } from 'vitest'
import { buildLeagueViews, isPermanentLeague } from './leagues'
import type { League } from '../types/league'
import type { Character } from '../types/character'

function league(partial: Partial<League>): League {
  return {
    id: 'Standard',
    realm: 'pc',
    url: 'https://www.pathofexile.com',
    startAt: null,
    endAt: null,
    characters: [],
    ...partial,
  }
}

function character(partial: Partial<Character>): Character {
  return {
    name: 'Unnamed',
    league: 'Standard',
    class: 'Witch',
    ascendancy: 'Necromancer',
    level: 80,
    experience: 1000000,
    fetchedAt: '2026-08-16T00:00:00Z',
    ...partial,
  }
}

describe('isPermanentLeague', () => {
  it('既知の常設リーグ ID を常設と判定する', () => {
    expect(isPermanentLeague('Standard')).toBe(true)
    expect(isPermanentLeague('Hardcore')).toBe(true)
  })

  it('チャレンジリーグ ID を非常設と判定する', () => {
    expect(isPermanentLeague('Affliction')).toBe(false)
    expect(isPermanentLeague('Allflame')).toBe(false)
  })

  it('leagues JSON の詳細で startAt が null のリーグを常設と判定する', () => {
    expect(isPermanentLeague('Standard', league({ id: 'Standard', startAt: null }))).toBe(true)
  })

  it('leagues JSON の詳細で startAt が日付のリーグを非常設と判定する', () => {
    expect(
      isPermanentLeague('Standard', league({ startAt: '2026-04-01T20:00:00Z' })),
    ).toBe(false)
  })

  it('詳細の startAt を既知 ID 判定より優先する', () => {
    // API 上は期間限定だが ID が Standard と衝突するケースは無いはずだが、
    // startAt が日付なら非常設として扱う
    expect(isPermanentLeague('Standard', league({ startAt: '2026-01-01T00:00:00Z' }))).toBe(false)
  })
})

describe('buildLeagueViews', () => {
  const leagues: League[] = [
    league({ id: 'Standard', characters: ['OldChar'] }),
    league({
      id: 'Affliction',
      startAt: '2026-04-01T20:00:00Z',
      endAt: null,
      characters: ['NecroBlast'],
    }),
  ]
  const characters: Character[] = [
    character({ name: 'Aoooooo', league: 'Standard' }),
    character({ name: 'Crytyon', league: 'Standard' }),
    character({ name: 'AllflameChar', league: 'Allflame' }),
    character({ name: 'EventChar', league: 'Phrecia 2.0' }),
  ]

  it('leagues JSON とキャラ由来のリーグをマージする', () => {
    const views = buildLeagueViews(leagues, characters)
    expect(views.map((v) => v.id)).toEqual(
      expect.arrayContaining(['Standard', 'Affliction', 'Allflame', 'Phrecia 2.0']),
    )
  })

  it('キャラ数は実キャラデータで数え、leagues JSON 由来の詳細を保持する', () => {
    const views = buildLeagueViews(leagues, characters)
    const standard = views.find((v) => v.id === 'Standard')
    // JSON の characters(['OldChar']) ではなく実データ(2体)を優先する
    expect(standard?.characterCount).toBe(2)
    expect(standard?.detail?.description).toBeUndefined()
    expect(standard?.detail?.url).toBe('https://www.pathofexile.com')
  })

  it('キャラのみに存在するリーグを非常設として導出する', () => {
    const views = buildLeagueViews(leagues, characters)
    const allflame = views.find((v) => v.id === 'Allflame')
    expect(allflame?.isPermanent).toBe(false)
    expect(allflame?.characterCount).toBe(1)
    expect(allflame?.detail).toBeUndefined()
  })

  it('常設/非常設を正しく分類する', () => {
    const views = buildLeagueViews(leagues, characters)
    expect(views.filter((v) => v.isPermanent).map((v) => v.id)).toEqual(['Standard'])
    expect(views.filter((v) => !v.isPermanent).map((v) => v.id)).not.toContain('Standard')
  })

  it('グループ内でキャラ数降順、同数は id 昇順に並べる', () => {
    const views = buildLeagueViews(leagues, characters)
    // 常設: Standard(2) のみ
    // 非常設: Allflame(1), Phrecia 2.0(1), Affliction(0) → 同数は id 昇順で
    //   Allflame < Phrecia 2.0、キャラ0の Affliction は最後
    expect(views.map((v) => `${v.id}:${v.characterCount}`)).toEqual([
      'Standard:2',
      'Allflame:1',
      'Phrecia 2.0:1',
      'Affliction:0',
    ])
  })

  it('キャラが存在しないリーグも件数 0 で残す', () => {
    const views = buildLeagueViews([league({ id: 'Affliction', startAt: '2026-04-01T00:00:00Z' })], [])
    expect(views).toHaveLength(1)
    expect(views[0]).toMatchObject({ id: 'Affliction', characterCount: 0, isPermanent: false })
  })
})
