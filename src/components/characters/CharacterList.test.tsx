import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CharacterList from './CharacterList'
import type { Character } from '../../types/character'

// コンポーネントは loadCharacters() で実データを読むため、テストでは固定データを返す。
vi.mock('../../utils/contentLoader', () => ({
  loadCharacters: vi.fn(() => mockCharacters),
}))

const mockCharacters: Character[] = [
  {
    name: 'NecroMain',
    league: 'Standard',
    class: 'Witch',
    ascendancy: 'Necromancer',
    level: 92,
    experience: 1,
    fetchedAt: '2026-11-01T00:00:00Z',
  },
  {
    name: 'SlayerFarm',
    league: 'Standard',
    class: 'Duelist',
    ascendancy: 'Slayer',
    level: 75,
    experience: 1,
    fetchedAt: '2026-11-01T00:00:00Z',
  },
  {
    name: 'DeadeyeAlt',
    league: 'Hardcore',
    class: 'Ranger',
    ascendancy: 'Deadeye',
    level: 83,
    experience: 1,
    fetchedAt: '2026-11-01T00:00:00Z',
  },
]

function setup(selectedLeague = 'all') {
  const onSelect = vi.fn()
  render(<CharacterList selectedLeague={selectedLeague} onSelect={onSelect} />)
  return { onSelect }
}

// カードは「Lv.{level}」バッジで並び順を検証できるようにレベルを手がかりにする。
function cardNamesByLevelOrder(): string[] {
  return screen.getAllByRole('button', { name: /Lv\./ }).map((el) => {
    const name = el.querySelector('h3')?.textContent ?? ''
    return name
  })
}

// vitest を globals: false で使うため auto-cleanup が効かず、明示的に掃除する。
afterEach(cleanup)

describe('CharacterList', () => {
  it('キャラクター卡片がグリッド表示され、クリックで onSelect が呼ばれる', () => {
    const { onSelect } = setup()

    expect(screen.getByText('NecroMain')).toBeTruthy()
    expect(screen.getByText('SlayerFarm')).toBeTruthy()
    expect(screen.getByText('DeadeyeAlt')).toBeTruthy()

    fireEvent.click(screen.getByText('NecroMain'))
    expect(onSelect).toHaveBeenCalledWith('NecroMain')
  })

  it('selectedLeague がリーグで絞り込む', () => {
    setup('Standard')

    expect(screen.getByText('NecroMain')).toBeTruthy()
    expect(screen.getByText('SlayerFarm')).toBeTruthy()
    expect(screen.queryByText('DeadeyeAlt')).toBeNull()
  })

  it('基礎クラスフィルタが機能する', () => {
    setup()

    fireEvent.change(screen.getByLabelText('Filter by base class'), { target: { value: 'Witch' } })

    expect(screen.getByText('NecroMain')).toBeTruthy()
    expect(screen.queryByText('SlayerFarm')).toBeNull()
    expect(screen.queryByText('DeadeyeAlt')).toBeNull()
  })

  it('レベルソートのトグルで並び順が反転する', () => {
    setup()

    // 初期状態は昇順 (75 → 83 → 92)
    expect(cardNamesByLevelOrder()).toEqual(['SlayerFarm', 'DeadeyeAlt', 'NecroMain'])

    fireEvent.click(screen.getByRole('button', { name: 'Lv ↑' }))

    expect(cardNamesByLevelOrder()).toEqual(['NecroMain', 'DeadeyeAlt', 'SlayerFarm'])
  })

  it('By Class ビューに切り替えると基礎クラス単位でグループ化される', () => {
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'By Class' }))

    const witchSection = screen.getByText('Witch (1)', { exact: false }).closest('section')
    expect(witchSection).not.toBeNull()
    // 見出し(h4)とカードの両方に現れるため複数ヒットを許容する
    expect(within(witchSection!).getAllByText('Necromancer').length).toBeGreaterThan(0)
  })

  it('表示対象が無い場合に空状態のメッセージを出す', () => {
    setup('存在しないリーグ')

    expect(screen.getByText('No characters found.')).toBeTruthy()
  })
})
