export interface HistoryEntry {
  name: string
  league: string
  level: number
}

// HistorySnapshot は 1 日 1 ファイル (content/history/<date>.json) の
// 全キャラレベルスナップショット。date は JST 暦日 (YYYY-MM-DD)。
export interface HistorySnapshot {
  date: string
  fetchedAt: string
  characters: HistoryEntry[]
}
