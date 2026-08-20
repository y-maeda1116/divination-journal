package main

import (
	"errors"
	"testing"
	"time"

	"github.com/poe-diary/fetch-poe-data/api"
	"github.com/poe-diary/fetch-poe-data/models"
)

// stubFetcher は GetCharacterItems の挙動を呼び出し回数ごとに差し替えるモック。
type stubFetcher struct {
	responses []error // 呼び出し順に返すエラー(nil は成功)
	calls     int
}

func (s *stubFetcher) GetCharacters() ([]models.APICharacter, error) {
	return nil, nil
}

func (s *stubFetcher) GetCharacterItems(string) (*models.APICharacterItems, error) {
	index := s.calls
	s.calls++
	if index >= len(s.responses) {
		index = len(s.responses) - 1
	}
	if err := s.responses[index]; err != nil {
		return nil, err
	}
	return &models.APICharacterItems{}, nil
}

func (s *stubFetcher) GetLeagues() ([]models.APILeague, error) {
	return nil, nil
}

// shortWaits はテスト用に待機時間をゼロにする。
func shortWaits(t *testing.T) {
	t.Helper()
	origBackoff := itemsRetryBackoff
	itemsRetryBackoff = func(int) time.Duration { return 0 }
	t.Cleanup(func() { itemsRetryBackoff = origBackoff })
}

// TestBuildHistorySnapshotUsesJSTDate はスナップショットの日付キーが JST 暦日である
// ことを検証する。日次 fetch は JST 05:17 (= UTC 前日 20:17) に走るため、UTC のまま
// 日付を切ると履歴の日付が 1 日ずれる。
func TestBuildHistorySnapshotUsesJSTDate(t *testing.T) {
	// UTC 2026-08-19 20:30 = JST 2026-08-20 05:30
	now := time.Date(2026, 8, 19, 20, 30, 0, 0, time.UTC)
	chars := []models.APICharacter{
		{Name: "CharA", League: "Standard", Level: 90},
		{Name: "CharB", League: "Settlers", Level: 42},
	}

	snap := buildHistorySnapshot(chars, now)

	if snap.Date != "2026-08-20" {
		t.Errorf("expected JST date 2026-08-20, got %q", snap.Date)
	}
	if snap.FetchedAt != "2026-08-19T20:30:00Z" {
		t.Errorf("unexpected fetchedAt: %q", snap.FetchedAt)
	}
	if len(snap.Characters) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(snap.Characters))
	}
	if snap.Characters[0] != (models.HistoryEntry{Name: "CharA", League: "Standard", Level: 90}) {
		t.Errorf("unexpected entry 0: %+v", snap.Characters[0])
	}
}

// TestFormatLastLogin は旧 API の lastLoginTime (unix 秒) の変換を検証する。
// 0 以下は「不明」を意味し nil を返す(出力 JSON からフィールドが落ちる)。
func TestFormatLastLogin(t *testing.T) {
	if got := formatLastLogin(0); got != nil {
		t.Errorf("expected nil for 0, got %v", *got)
	}
	if got := formatLastLogin(-1); got != nil {
		t.Errorf("expected nil for negative, got %v", *got)
	}

	got := formatLastLogin(1755500000)
	if got == nil {
		t.Fatal("expected a value, got nil")
	}
	if *got != "2025-08-18T06:53:20Z" {
		t.Errorf("unexpected RFC3339: %q", *got)
	}
}

// TestFetchItemsWithRetryRecovers はレート制限後に再試行して成功することを検証する。
func TestFetchItemsWithRetryRecovers(t *testing.T) {
	shortWaits(t)
	fetcher := &stubFetcher{responses: []error{
		api.ErrRateLimit,
		api.ErrRateLimit,
		nil,
	}}

	items, err := fetchItemsWithRetry(fetcher, "MyChar")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if items == nil {
		t.Fatal("expected items, got nil")
	}
	if fetcher.calls != 3 {
		t.Errorf("expected 3 calls, got %d", fetcher.calls)
	}
}

// TestFetchItemsWithRetryGivesUp はレート制限が続き最大試行回数に達したら
// エラーを返すことを検証する。
func TestFetchItemsWithRetryGivesUp(t *testing.T) {
	shortWaits(t)
	fetcher := &stubFetcher{responses: []error{api.ErrRateLimit}}

	_, err := fetchItemsWithRetry(fetcher, "MyChar")
	if err == nil {
		t.Fatal("expected an error, got nil")
	}
	if !errors.Is(err, api.ErrRateLimit) {
		t.Errorf("expected ErrRateLimit, got %v", err)
	}
	if fetcher.calls != itemsMaxAttempts {
		t.Errorf("expected %d calls, got %d", itemsMaxAttempts, fetcher.calls)
	}
}

// TestFetchItemsWithRetryNoRetryOnAuthError はレート制限以外のエラーでは
// 再試行しないことを検証する。
func TestFetchItemsWithRetryNoRetryOnAuthError(t *testing.T) {
	shortWaits(t)
	fetcher := &stubFetcher{responses: []error{api.ErrAuthentication}}

	_, err := fetchItemsWithRetry(fetcher, "MyChar")
	if err == nil {
		t.Fatal("expected an error, got nil")
	}
	if fetcher.calls != 1 {
		t.Errorf("expected 1 call, got %d", fetcher.calls)
	}
}
