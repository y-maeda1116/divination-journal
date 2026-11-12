import { describe, expect, it } from 'vitest'
import { buildHash, parseHash } from './router'

// parseHash / buildHash は URL hash (例: #/characters/NAME?league=Standard) と
// ルート状態の相互変換を行う純粋関数。不正な入力はデフォルト (dashboard / all)
// へフォールバックする。

describe('parseHash', () => {
  it('空 hash は dashboard / all を返す', () => {
    expect(parseHash('')).toEqual({ tab: 'dashboard', league: 'all' })
    expect(parseHash('#/')).toEqual({ tab: 'dashboard', league: 'all' })
  })

  it('タブのみの hash を解析できる', () => {
    expect(parseHash('#/characters')).toEqual({ tab: 'characters', league: 'all' })
    expect(parseHash('#/diary')).toEqual({ tab: 'diary', league: 'all' })
    expect(parseHash('#/stats')).toEqual({ tab: 'stats', league: 'all' })
  })

  it('キャラクター詳細を解析できる', () => {
    expect(parseHash('#/characters/NecroMain')).toEqual({
      tab: 'characters',
      league: 'all',
      character: 'NecroMain',
    })
  })

  it('日記記事を解析できる', () => {
    expect(parseHash('#/diary/2026-04-01')).toEqual({
      tab: 'diary',
      league: 'all',
      diaryDate: '2026-04-01',
    })
  })

  it('league クエリを解析できる', () => {
    expect(parseHash('#/characters?league=Affliction')).toEqual({
      tab: 'characters',
      league: 'Affliction',
    })
    expect(parseHash('#/characters/NecroMain?league=Standard')).toEqual({
      tab: 'characters',
      league: 'Standard',
      character: 'NecroMain',
    })
  })

  it('URL エンコードされたキャラ名をデコードする', () => {
    expect(parseHash('#/characters/Jos%C3%A9phin_P%C3%A9ladan')).toEqual({
      tab: 'characters',
      league: 'all',
      character: 'Joséphin_Péladan',
    })
  })

  it('不明なタブは dashboard にフォールバックする', () => {
    expect(parseHash('#/unknown')).toEqual({ tab: 'dashboard', league: 'all' })
    expect(parseHash('#/characters/../../etc')).toEqual({ tab: 'characters', league: 'all' })
  })

  it('余分なパスセグメントは無視する', () => {
    expect(parseHash('#/diary/2026-04-01/extra')).toEqual({
      tab: 'diary',
      league: 'all',
      diaryDate: '2026-04-01',
    })
  })
})

describe('buildHash', () => {
  it('デフォルト状態は dashboard hash を返す', () => {
    expect(buildHash({ tab: 'dashboard', league: 'all' })).toBe('#/dashboard')
  })

  it('league は all 以外のときのみクエリに含める', () => {
    expect(buildHash({ tab: 'stats', league: 'Affliction' })).toBe('#/stats?league=Affliction')
  })

  it('キャラクター詳細の hash を構築できる', () => {
    expect(
      buildHash({ tab: 'characters', league: 'Standard', character: 'NecroMain' }),
    ).toBe('#/characters/NecroMain?league=Standard')
  })

  it('日記記事の hash を構築できる', () => {
    expect(buildHash({ tab: 'diary', league: 'all', diaryDate: '2026-04-01' })).toBe(
      '#/diary/2026-04-01',
    )
  })

  it('非 ASCII キャラ名は URL エンコードする', () => {
    expect(
      buildHash({ tab: 'characters', league: 'all', character: 'Joséphin_Péladan' }),
    ).toBe('#/characters/Jos%C3%A9phin_P%C3%A9ladan')
  })
})

describe('parseHash と buildHash の往復', () => {
  it('buildHash の結果を parseHash で復元できる', () => {
    const states = [
      { tab: 'dashboard' as const, league: 'all' },
      { tab: 'leagues' as const, league: 'Hardcore' },
      { tab: 'characters' as const, league: 'Standard', character: 'Joséphin_Péladan' },
      { tab: 'diary' as const, league: 'all', diaryDate: '2026-04-01' },
    ]
    for (const state of states) {
      expect(parseHash(buildHash(state))).toEqual(state)
    }
  })
})
