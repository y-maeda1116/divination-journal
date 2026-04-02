package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/poe-diary/fetch-poe-data/api"
	"github.com/poe-diary/fetch-poe-data/models"
	"github.com/poe-diary/fetch-poe-data/output"
)

func main() {
	account := flag.String("account", "", "PoE account name (required)")
	league := flag.String("league", "", "League name filter (optional)")
	outputDir := flag.String("output-dir", "../../content", "Output directory for JSON files")
	flag.Parse()

	if *account == "" {
		fmt.Fprintln(os.Stderr, "Usage: fetch-poe-data --account=<name> [--league=<league>] [--output-dir=<dir>]")
		os.Exit(1)
	}

	client := api.NewClient(*account)

	// Fetch characters
	fmt.Printf("Fetching characters for account: %s\n", *account)
	apiChars, err := client.GetCharacters()
	if err != nil {
		log.Fatalf("Failed to fetch characters: %v", err)
	}
	fmt.Printf("  Found %d characters\n", len(apiChars))

	// Track character names per league
	leagueCharMap := map[string][]string{}

	for _, ac := range apiChars {
		if *league != "" && ac.League != *league {
			continue
		}

		fmt.Printf("Fetching items for: %s (%s, Lv.%d)\n", ac.Name, ac.League, ac.Level)

		char := &models.Character{
			Name:       ac.Name,
			League:     ac.League,
			Class:      ac.Class,
			Ascendancy: ac.Ascendancy,
			Level:      ac.Level,
			Experience: ac.Experience,
			FetchedAt:  models.NowUTC(),
		}

		// Fetch items (optional - may fail for private profiles)
		items, err := client.GetCharacterItems(ac.Name)
		if err != nil {
			fmt.Printf("  Warning: could not fetch items for %s: %v\n", ac.Name, err)
		} else {
			char.Items = mapAPIItems(items)
			char.Passives = &models.Passives{
				Hashes:      items.Passives.Hashes,
				SkillPoints: items.Passives.SkillPoints,
			}
		}

		if err := output.WriteCharacter(*outputDir, char); err != nil {
			log.Fatalf("Failed to write character %s: %v", ac.Name, err)
		}

		leagueCharMap[ac.League] = append(leagueCharMap[ac.League], ac.Name)
	}

	// Fetch leagues
	fmt.Println("Fetching leagues...")
	apiLeagues, err := client.GetLeagues()
	if err != nil {
		fmt.Printf("Warning: could not fetch leagues: %v\n", err)
	} else {
		for _, al := range apiLeagues {
			if *league != "" && al.ID != *league {
				continue
			}

			lg := &models.League{
				ID:          al.ID,
				Realm:       al.Realm,
				URL:         al.URL,
				StartAt:     al.StartAt,
				EndAt:       al.EndAt,
				Characters:  leagueCharMap[al.ID],
			}

			// Try to load existing league file to preserve goals
			existing := loadExistingLeague(*outputDir, al.ID)
			if existing != nil {
				lg.Description = existing.Description
				lg.Goals = existing.Goals
			}

			if err := output.WriteLeague(*outputDir, lg); err != nil {
				log.Fatalf("Failed to write league %s: %v", al.ID, err)
			}
		}
	}

	fmt.Println("Done!")
}

func mapAPIItems(apiItems *models.APICharacterItems) *models.Items {
	if apiItems == nil {
		return nil
	}

	items := &models.Items{}
	slotMap := map[string]**models.Item{
		"Weapon":     &items.Weapon,
		"Offhand":    &items.Offhand,
		"Helm":       &items.Helmet,
		"BodyArmour": &items.BodyArmour,
		"Gloves":     &items.Gloves,
		"Boots":      &items.Boots,
		"Belt":       &items.Belt,
		"Ring":       &items.Ring1,
		"Ring2":      &items.Ring2,
		"Amulet":     &items.Amulet,
	}

	rarityMap := map[int]string{
		0: "Normal", 1: "Magic", 2: "Rare", 3: "Unique", 4: "Currency",
	}

	for _, apiItem := range apiItems.Items {
		mapped := &models.Item{
			Name:         apiItem.Name,
			TypeLine:     apiItem.TypeLine,
			Rarity:       rarityMap[apiItem.Rarity],
			Icon:         apiItem.Icon,
			ItemLevel:    apiItem.ItemLevel,
			ExplicitMods: apiItem.ExplicitMods,
			ImplicitMods: apiItem.ImplicitMods,
		}

		slotKey := apiItem.InventoryID
		if ptr, ok := slotMap[slotKey]; ok {
			*ptr = mapped
		} else if strings.HasPrefix(slotKey, "Flask") {
			items.Flasks = append(items.Flasks, *mapped)
		}
	}

	return items
}

func loadExistingLeague(dir, id string) *models.League {
	path := fmt.Sprintf("%s/leagues/%s.json", dir, id)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil
	}

	var league models.League
	if err := json.Unmarshal(data, &league); err != nil {
		return nil
	}

	return &league
}
