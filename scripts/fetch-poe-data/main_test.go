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
