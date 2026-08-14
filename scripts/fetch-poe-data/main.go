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

const usage = `Usage:
  fetch-poe-data auth  --client-id=<id> [--port=<port>]
  fetch-poe-data fetch --client-id=<id> --refresh-token=<token> [--league=<league>] [--output-dir=<dir>]

auth:   Run the OAuth2 authorization flow (Authorization Code + PKCE) locally and
        print the refresh token. Set it as the POE_REFRESH_TOKEN GitHub secret.
fetch:  Exchange the refresh token for an access token, fetch character and
        league data, and write JSON files to the output directory.

Hint: in GitHub Actions, ensure the POE_CLIENT_ID and POE_REFRESH_TOKEN secrets are set.
The refresh token expires after 7 days at most; re-run auth and update the secret then.`

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, usage)
		os.Exit(1)
	}

	switch os.Args[1] {
	case "auth":
		runAuth(os.Args[2:])
	case "fetch":
		runFetch(os.Args[2:])
	default:
		fmt.Fprintln(os.Stderr, usage)
		os.Exit(1)
	}
}

func runAuth(args []string) {
	clientID := flag.String("client-id", "", "OAuth2 client_id of your registered project (required)")
	port := flag.Int("port", 14500, "Local port for the OAuth2 callback server")
	flag.CommandLine.Parse(args)

	if *clientID == "" {
		fmt.Fprintln(os.Stderr, "Error: --client-id is required.")
		fmt.Fprintln(os.Stderr, usage)
		os.Exit(1)
	}

	token, err := api.RunLocalAuth(*clientID, *port)
	if err != nil {
		log.Fatalf("Authorization failed: %v", err)
	}

	fmt.Println("Authorization succeeded!")
	fmt.Println()
	fmt.Println("Refresh token (set as the POE_REFRESH_TOKEN GitHub secret):")
	fmt.Printf("  %s\n", token.RefreshToken)
}

func runFetch(args []string) {
	clientID := flag.String("client-id", os.Getenv("POE_CLIENT_ID"), "OAuth2 client_id of your registered project (required; env: POE_CLIENT_ID)")
	refreshToken := flag.String("refresh-token", os.Getenv("POE_REFRESH_TOKEN"), "OAuth2 refresh token obtained by the auth subcommand (required; env: POE_REFRESH_TOKEN)")
	league := flag.String("league", "", "League name filter (optional)")
	outputDir := flag.String("output-dir", "../../content", "Output directory for JSON files")
	flag.CommandLine.Parse(args)

	if *clientID == "" || *refreshToken == "" {
		fmt.Fprintln(os.Stderr, "Error: --client-id and --refresh-token are required.")
		fmt.Fprintln(os.Stderr, usage)
		fmt.Fprintln(os.Stderr, "Hint: in GitHub Actions, ensure the POE_CLIENT_ID and POE_REFRESH_TOKEN secrets are set.")
		os.Exit(1)
	}

	fmt.Println("Exchanging refresh token for an access token...")
	token, err := api.RefreshAccessToken(*clientID, *refreshToken)
	if err != nil {
		log.Fatalf("Token refresh failed (the refresh token may be expired; re-run auth): %v", err)
	}
	fmt.Println("  Access token obtained")

	client := api.NewClient(token.AccessToken)

	// Fetch characters
	fmt.Println("Fetching characters...")
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
			Level:      ac.Level,
			Experience: ac.Experience,
			FetchedAt:  models.NowUTC(),
		}

		// Fetch items (optional - may fail for some realms)
		items, err := client.GetCharacterItems(ac.Name)
		if err != nil {
			fmt.Printf("  Warning: could not fetch items for %s: %v\n", ac.Name, err)
		} else {
			char.Items = mapAPIItems(items)
			char.Passives = &models.Passives{
				Hashes:       items.Character.Passives.Hashes,
				BanditChoice: items.Character.Passives.BanditChoice,
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
				ID:         al.ID,
				Realm:      al.Realm,
				URL:        al.URL,
				StartAt:    al.StartAt,
				EndAt:      al.EndAt,
				Characters: leagueCharMap[al.ID],
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
		"Helmet":     &items.Helmet,
		"BodyArmour": &items.BodyArmour,
		"Gloves":     &items.Gloves,
		"Boots":      &items.Boots,
		"Belt":       &items.Belt,
		"Ring":       &items.Ring1,
		"Ring2":      &items.Ring2,
		"Amulet":     &items.Amulet,
	}

	modDescriptions := func(mods []models.APIItemMod) []string {
		if len(mods) == 0 {
			return nil
		}
		descs := make([]string, 0, len(mods))
		for _, m := range mods {
			if m.Description != "" {
				descs = append(descs, m.Description)
			}
		}
		return descs
	}

	for _, apiItem := range apiItems.Character.Equipment {
		mapped := &models.Item{
			Name:         apiItem.Name,
			TypeLine:     apiItem.TypeLine,
			Rarity:       apiItem.Rarity,
			Icon:         apiItem.Icon,
			ItemLevel:    apiItem.ItemLevel,
			ExplicitMods: modDescriptions(apiItem.ExplicitMods),
			ImplicitMods: modDescriptions(apiItem.ImplicitMods),
		}

		// 旧 API は "Helm"、OAuth2 API は "Helmet" の可能性があるため両方を受け付ける。
		// なお Weapon2/Offhand2(武器持ち替え)は意図的に出力しない。
		slotKey := apiItem.InventoryID
		if strings.HasPrefix(slotKey, "Flask") {
			items.Flasks = append(items.Flasks, *mapped)
			continue
		}
		if ptr, ok := slotMap[slotKey]; ok {
			*ptr = mapped
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
