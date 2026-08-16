import { describe, expect, it } from 'vitest'
import { baseClassOf, groupCharactersByClass } from './characterClasses'
import type { Character } from '../types/character'

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

describe('baseClassOf', () => {
  it('class にアセンダンシー名が入ったキャラを対応表の基礎クラスに分類する', () => {
    expect(baseClassOf(character({ class: 'Necromancer' }))).toBe('Witch')
    expect(baseClassOf(character({ class: 'Elementalist' }))).toBe('Witch')
    expect(baseClassOf(character({ class: 'Juggernaut' }))).toBe('Marauder')
    expect(baseClassOf(character({ class: 'Trickster' }))).toBe('Shadow')
    expect(baseClassOf(character({ class: 'Reliquarian' }))).toBe('Scion')
  })

  it('class が基礎クラス名(未昇順)のキャラをその基礎クラスに分類する', () => {
    expect(baseClassOf(character({ class: 'Witch' }))).toBe('Witch')
    expect(baseClassOf(character({ class: 'Marauder' }))).toBe('Marauder')
  })

  it('ascendancy フィールドを class より優先する', () => {
    expect(baseClassOf(character({ class: 'Witch', ascendancy: 'Necromancer' }))).toBe('Witch')
  })

  it('対応表に無い名前は Other にフォールバックする', () => {
    expect(baseClassOf(character({ class: 'Herald' }))).toBe('Other')
    expect(baseClassOf(character({ class: 'Paladin' }))).toBe('Other')
  })
})

describe('groupCharactersByClass', () => {
  it('基礎クラス→アセンダンシーの2階層にグループ化する', () => {
    const groups = groupCharactersByClass([
      character({ name: 'A', class: 'Necromancer' }),
      character({ name: 'B', class: 'Elementalist' }),
      character({ name: 'C', class: 'Juggernaut' }),
    ])
    expect(groups.map((g) => g.baseClass)).toEqual(['Witch', 'Marauder'])
    const witch = groups[0]
    // キャラ数が同数(1体)のため名前昇順になる
    expect(witch.ascendancies.map((a) => a.ascendancy)).toEqual([
      'Elementalist',
      'Necromancer',
    ])
    expect(witch.total).toBe(2)
  })

  it('基礎クラスは固定順、Other は最後に並ぶ', () => {
    const groups = groupCharactersByClass([
      character({ name: 'A', class: 'Slayer' }), // Duelist
      character({ name: 'B', class: 'Herald' }), // Other
      character({ name: 'C', class: 'Chieftain' }), // Marauder
      character({ name: 'D', class: 'Witch' }), // Witch(未昇順)
    ])
    expect(groups.map((g) => g.baseClass)).toEqual(['Witch', 'Marauder', 'Duelist', 'Other'])
  })

  it('アセンダンシー内はレベル降順、同レベルは名前昇順', () => {
    const groups = groupCharactersByClass([
      character({ name: 'Zeta', class: 'Necromancer', level: 90 }),
      character({ name: 'Alpha', class: 'Necromancer', level: 95 }),
      character({ name: 'Mid', class: 'Necromancer', level: 90 }),
    ])
    expect(groups[0].ascendancies[0].characters.map((c) => c.name)).toEqual([
      'Alpha',
      'Mid',
      'Zeta',
    ])
  })

  it('基礎クラス内のアセンダンシーはキャラ数降順、同数は名前昇順', () => {
    const groups = groupCharactersByClass([
      character({ name: 'A', class: 'Occultist' }),
      character({ name: 'B', class: 'Necromancer' }),
      character({ name: 'C', class: 'Elementalist' }),
      character({ name: 'D', class: 'Necromancer' }),
    ])
    expect(groups[0].ascendancies.map((a) => a.ascendancy)).toEqual([
      'Necromancer',
      'Elementalist',
      'Occultist',
    ])
  })

  it('ascendancy があるキャラは ascendancy 名でグループ化される', () => {
    const groups = groupCharactersByClass([
      character({ name: 'A', class: 'Witch', ascendancy: 'Necromancer' }),
      character({ name: 'B', class: 'Necromancer' }),
    ])
    expect(groups[0].ascendancies.map((a) => a.ascendancy)).toEqual(['Necromancer'])
    expect(groups[0].ascendancies[0].characters).toHaveLength(2)
  })

  it('空配列には空グループを返す', () => {
    expect(groupCharactersByClass([])).toEqual([])
  })
})
