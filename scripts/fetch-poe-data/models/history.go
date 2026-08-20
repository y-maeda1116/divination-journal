package models

// HistoryEntry は履歴スナップショットに含める 1 キャラ分の最小データ。
// レベル推移の描画に必要な項目のみを持たせ、ファイルサイズを抑える。
type HistoryEntry struct {
	Name   string `json:"name"`
	League string `json:"league"`
	Level  int    `json:"level"`
}

// HistorySnapshot は 1 日 1 ファイル (history/<date>.json) で保存する
// 全キャラのレベルスナップショット。Date は JST 暦日 (YYYY-MM-DD)。
type HistorySnapshot struct {
	Date       string         `json:"date"`
	FetchedAt  string         `json:"fetchedAt"`
	Characters []HistoryEntry `json:"characters"`
}
