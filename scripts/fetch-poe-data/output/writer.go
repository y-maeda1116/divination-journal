package output

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/poe-diary/fetch-poe-data/models"
)

func WriteCharacter(dir string, char *models.Character) error {
	if err := os.MkdirAll(filepath.Join(dir, "characters"), 0o755); err != nil {
		return fmt.Errorf("creating characters dir: %w", err)
	}

	path := filepath.Join(dir, "characters", char.Name+".json")
	data, err := json.MarshalIndent(char, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling character %s: %w", char.Name, err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing character file %s: %w", path, err)
	}

	fmt.Printf("  Written: %s\n", path)
	return nil
}

func WriteLeague(dir string, league *models.League) error {
	if err := os.MkdirAll(filepath.Join(dir, "leagues"), 0o755); err != nil {
		return fmt.Errorf("creating leagues dir: %w", err)
	}

	path := filepath.Join(dir, "leagues", league.ID+".json")
	data, err := json.MarshalIndent(league, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling league %s: %w", league.ID, err)
	}

	if err := os.WriteFile(path, data, 0o644); err != nil {
		return fmt.Errorf("writing league file %s: %w", path, err)
	}

	fmt.Printf("  Written: %s\n", path)
	return nil
}
