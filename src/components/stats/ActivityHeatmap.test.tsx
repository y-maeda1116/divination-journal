import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ActivityHeatmap from './ActivityHeatmap'
import { loadHistory } from '../../utils/contentLoader'
import type { HistorySnapshot } from '../../types/history'

// ActivityHeatmap は loadHistory() で実履歴を読むため、テストでは固定データを返す。
vi.mock('../../utils/contentLoader', () => ({
  loadHistory: vi.fn(() => Promise.resolve(snapshots)),
}))

// 2026-08-21 (金) 〜 2026-08-23 (日) の3日分。2日目に +4、3日目に +3。
const snapshots: HistorySnapshot[] = [
  {
    date: '2026-08-21',
    fetchedAt: '2026-08-21T00:00:00Z',
    characters: [{ name: 'Aoo', league: 'Standard', level: 80 }],
  },
  {
    date: '2026-08-22',
    fetchedAt: '2026-08-22T00:00:00Z',
    characters: [{ name: 'Aoo', league: 'Standard', level: 84 }],
  },
  {
    date: '2026-08-23',
    fetchedAt: '2026-08-23T00:00:00Z',
    characters: [{ name: 'Aoo', league: 'Standard', level: 87 }],
  },
]

afterEach(() => {
  cleanup()
})

describe('ActivityHeatmap', () => {
  it('プレイした日の合計とアクティブ日数のサマリーを表示する', async () => {
    render(<ActivityHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('2 active days · 7 levels gained')).toBeTruthy()
    })
  })

  it('各日のセルに日付と増分の title 属性を付ける', async () => {
    render(<ActivityHeatmap />)

    await waitFor(() => {
      expect(screen.getByTitle('2026-08-22: +4 levels')).toBeTruthy()
    })
    expect(screen.getByTitle('2026-08-23: +3 levels')).toBeTruthy()
    expect(screen.getByTitle('2026-08-21: no progress')).toBeTruthy()
  })

  it('データがないときは案内を表示する', async () => {
    vi.mocked(loadHistory).mockResolvedValueOnce([])
    render(<ActivityHeatmap />)

    await waitFor(() => {
      expect(screen.getByText('No play history yet.')).toBeTruthy()
    })
  })
})
