package output

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/poe-diary/fetch-poe-data/models"
)

// characterFixture は WriteCharacter テスト用の最小キャラを返す。
func characterFixture() *models.Character {
	return &models.Character{
		Name:       "MyChar",
		League:     "Standard",
		Class:      "Witch",
		Ascendancy: "Necromancer",
		Level:      90,
		FetchedAt:  "2026-08-19T20:30:00Z",
	}
}

// TestWriteCharacterCreatesFile は characters/<name>.json が期待する形状で
// 作られることを検証する。
func TestWriteCharacterCreatesFile(t *testing.T) {
	dir := t.TempDir()

	if err := WriteCharacter(dir, characterFixture()); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	data, err := os.ReadFile(filepath.Join(dir, "characters", "MyChar.json"))
	if err != nil {
		t.Fatalf("reading written file: %v", err)
	}

	var char models.Character
	if err := json.Unmarshal(data, &char); err != nil {
		t.Fatalf("unmarshaling written file: %v", err)
	}
	if char.Name != "MyChar" || char.Level != 90 {
		t.Errorf("unexpected character: %+v", char)
	}
}

// TestWriteHistorySnapshotIsIdempotentPerDay は同日のスナップショット書き込みが
// 同じパスを上書きすること(1日1ファイル・冪等)を検証する。
func TestWriteHistorySnapshotIsIdempotentPerDay(t *testing.T) {
	dir := t.TempDir()

	first := &models.HistorySnapshot{
		Date:       "2026-08-20",
		FetchedAt:  "2026-08-19T20:30:00Z",
		Characters: []models.HistoryEntry{{Name: "MyChar", League: "Standard", Level: 90}},
	}
	if err := WriteHistorySnapshot(dir, first); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// 同日の再実行ではレベルが更新された内容で上書きされる
	second := &models.HistorySnapshot{
		Date:       "2026-08-20",
		FetchedAt:  "2026-08-19T21:00:00Z",
		Characters: []models.HistoryEntry{{Name: "MyChar", League: "Standard", Level: 91}},
	}
	if err := WriteHistorySnapshot(dir, second); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	entries, err := filepath.Glob(filepath.Join(dir, "history", "*.json"))
	if err != nil {
		t.Fatalf("globbing history dir: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected exactly 1 history file, got %d", len(entries))
	}

	data, err := os.ReadFile(filepath.Join(dir, "history", "2026-08-20.json"))
	if err != nil {
		t.Fatalf("reading written file: %v", err)
	}

	var snap models.HistorySnapshot
	if err := json.Unmarshal(data, &snap); err != nil {
		t.Fatalf("unmarshaling written file: %v", err)
	}
	if len(snap.Characters) != 1 || snap.Characters[0].Level != 91 {
		t.Errorf("expected overwritten snapshot with level 91, got %+v", snap.Characters)
	}
}
