import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from './types/character'
import type { League } from './types/league'
import type { DiaryEntry } from './types/diary'

// App は contentLoader 経由で実データを読むため、テストでは固定データを返す。
vi.mock('./utils/contentLoader', () => ({
  loadCharacters: () => mockCharacters,
  loadCharacterByName: (name: string) =>
    mockCharacters.find((c) => c.name === name),
  loadLeagues: () => mockLeagues,
  loadDiaryEntries: () => mockDiary,
  loadDiaryByDate: (date: string) => mockDiary.find((e) => e.date === date),
  loadHistory: () => Promise.resolve([]),
}))

// LevelChart (recharts) が jsdom に無い ResizeObserver を使うための polyfill
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

const mockCharacters: Character[] = [
  {
    name: 'TestChar',
    league: 'Standard',
    class: 'Witch',
    ascendancy: 'Necromancer',
    level: 92,
    experience: 1,
    fetchedAt: '2026-11-01T00:00:00Z',
  },
]

const mockLeagues: League[] = [
  {
    id: 'Standard',
    realm: 'pc',
    url: 'https://example.com/standard',
    startAt: '2013-01-23T21:00:00Z',
    endAt: null,
    characters: ['TestChar'],
  },
]

const mockDiary: DiaryEntry[] = [
  {
    title: 'League Start',
    date: '2026-04-01',
    league: 'Standard',
    character: 'TestChar',
    tags: ['league-start'],
    content: '# League Start\n\n最初のエントリ',
  },
]

function setHashAndNotify(hash: string) {
  window.location.hash = hash
  // jsdom の hash 変更に伴う hashchange 発火は非同期のため、明示的に dispatch して
  // ブラウザの挙動 (hash 変更 → 再描画) を即座に再現する
  fireEvent(window, new Event('hashchange'))
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('App hash routing', () => {
  it('キャラクター詳細の deep link で詳細画面を復元する', async () => {
    setHashAndNotify('#/characters/TestChar')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('← Back to characters')).toBeTruthy()
    })
    expect(screen.getByRole('heading', { name: 'TestChar' })).toBeTruthy()
    expect(window.location.hash).toBe('#/characters/TestChar')
  })

  it('日記記事の deep link で記事を復元する', async () => {
    setHashAndNotify('#/diary/2026-04-01')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('← Back to diary')).toBeTruthy()
    })
    // 記事タイトル (h1) と本文 Markdown の見出しで2箇所描画されるため複数ヒットする
    expect(screen.getAllByRole('heading', { name: 'League Start' }).length).toBeGreaterThan(0)
  })

  it('タブクリックで hash が更新される', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Leagues' }))

    expect(window.location.hash).toBe('#/leagues')
  })

  it('hashchange で表示が切り替わる (ブラウザバック相当)', () => {
    render(<App />)
    expect(screen.getByText('Active Characters')).toBeTruthy()

    setHashAndNotify('#/diary')

    expect(screen.getByRole('heading', { name: /^Diary$/ })).toBeTruthy()
    expect(screen.queryByText('Active Characters')).toBeNull()
  })

  it('リーグ選択で hash に league クエリが付く', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Standard/ }))

    expect(window.location.hash).toBe('#/dashboard?league=Standard')
  })
})
