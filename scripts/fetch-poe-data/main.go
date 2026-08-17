package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/poe-diary/fetch-poe-data/api"
	"github.com/poe-diary/fetch-poe-data/models"
	"github.com/poe-diary/fetch-poe-data/output"
)

const usage = `Usage:
  fetch-poe-data auth  --client-id=<id> [--port=<port>]
  fetch-poe-data fetch [--account=<name> --poesessid=<id>] [--client-id=<id> --refresh-token=<token>] [--league=<league>] [--output-dir=<dir>]

auth:   Run the OAuth2 authorization flow (Authorization Code + PKCE) locally and
        print the refresh token. Set it as the POE_REFRESH_TOKEN GitHub secret.
fetch:  Fetch character and league data and write JSON files to the output
        directory. The POESESSID method (--account/--poesessid) is tried first;
        if it fails, the OAuth2 method (--client-id/--refresh-token) is used.

Environment fallbacks: POE_ACCOUNT_NAME, POESESSID, POE_CLIENT_ID, POE_REFRESH_TOKEN.
The OAuth2 refresh token expires after 7 days at most; re-run auth and update the secret then.`

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
	account := flag.String("account", os.Getenv("POE_ACCOUNT_NAME"), "PoE account name (primary method; env: POE_ACCOUNT_NAME)")
	poesessid := flag.String("poesessid", os.Getenv("POESESSID"), "PoE session ID (primary method; env: POESESSID)")
	clientID := flag.String("client-id", os.Getenv("POE_CLIENT_ID"), "OAuth2 client_id (fallback method; env: POE_CLIENT_ID)")
	refreshToken := flag.String("refresh-token", os.Getenv("POE_REFRESH_TOKEN"), "OAuth2 refresh token (fallback method; env: POE_REFRESH_TOKEN)")
	league := flag.String("league", "", "League name filter (optional)")
	outputDir := flag.String("output-dir", "../../content", "Output directory for JSON files")
	flag.CommandLine.Parse(args)

	client := newFetcher(*account, *poesessid, *clientID, *refreshToken)

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
			Ascendancy: ac.Ascendancy,
			Level:      ac.Level,
			Experience: ac.Experience,
			FetchedAt:  models.NowUTC(),
		}

		// Fetch items (optional - may fail for some realms)
		items, err := fetchItemsWithRetry(client, ac.Name)
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

		// 連続リクエストによるレート制限を避けるため、キャラごとに間隔を空ける
		time.Sleep(itemsRequestInterval)

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

// newFetcher は資格情報に応じて取得経路を選ぶ。
// POESESSID (旧 character-window API) を主とし、失敗・未設定の場合は OAuth2 へ
// フォールバックする。新アカウントシステムでは旧 API が拒否されるため、
// 実際には OAuth2 で動くことを想定した保険構成。
func newFetcher(account, poesessid, clientID, refreshToken string) api.Fetcher {
	if account != "" && poesessid != "" {
		session := api.NewSessionClient(account, poesessid)
		// 経路の有効性を確認するプローブ。本取得でもう一度呼ぶため二重リクエストになるが、
		// 1日1回のバッチ用途では許容コスト。
		if _, err := session.GetCharacters(); err == nil {
			fmt.Println("Using POESESSID (character-window API)")
			return session
		} else {
			fmt.Printf("POESESSID method failed (%v); falling back to OAuth2\n", err)
		}
	}

	if clientID != "" && refreshToken != "" {
		fmt.Println("Exchanging refresh token for an access token...")
		token, err := api.RefreshAccessToken(clientID, refreshToken)
		if err != nil {
			log.Fatalf("Token refresh failed (the refresh token may be expired; re-run auth): %v", err)
		}
		fmt.Println("  Access token obtained")
		return api.NewClient(token.AccessToken)
	}

	fmt.Fprintln(os.Stderr, "Error: no usable credentials.")
	fmt.Fprintln(os.Stderr, "Provide either --account and --poesessid (POESESSID method), or --client-id and --refresh-token (OAuth2 method).")
	fmt.Fprintln(os.Stderr, usage)
	fmt.Fprintln(os.Stderr, "Hint: in GitHub Actions, set the POE_ACCOUNT_NAME/POESESSID and/or POE_CLIENT_ID/POE_REFRESH_TOKEN secrets.")
	os.Exit(1)
	return nil
}

// items の取得間隔とレート制限時のバックオフ待ち時間。テストで差し替える。
var (
	itemsRequestInterval = 2 * time.Second
	itemsRetryBackoff    = func(attempt int) time.Duration {
		return time.Duration(attempt*10) * time.Second
	}
)

const itemsMaxAttempts = 4

// fetchItemsWithRetry は items 取得がレート制限(429)に達した場合、
// バックオフ待ちのうえ再試行する。それ以外のエラーは即座に返す。
func fetchItemsWithRetry(client api.Fetcher, name string) (*models.APICharacterItems, error) {
	for attempt := 1; ; attempt++ {
		items, err := client.GetCharacterItems(name)
		if err == nil {
			return items, nil
		}
		if !errors.Is(err, api.ErrRateLimit) || attempt >= itemsMaxAttempts {
			return nil, err
		}
		wait := itemsRetryBackoff(attempt)
		fmt.Printf("  Rate limited on %s, retrying in %s (attempt %d/%d)...\n", name, wait, attempt, itemsMaxAttempts)
		time.Sleep(wait)
	}
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
