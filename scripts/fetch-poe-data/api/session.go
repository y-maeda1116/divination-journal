package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"time"

	"github.com/poe-diary/fetch-poe-data/models"
)

// Fetcher は POESESSID と OAuth2 の両経路に共通する取得インターフェース。
// どちらの経路も同じ models 形状へ変換して返すため、呼び出し側は経路を意識しない。
type Fetcher interface {
	GetCharacters() ([]models.APICharacter, error)
	GetCharacterItems(characterName string) (*models.APICharacterItems, error)
	GetLeagues() ([]models.APILeague, error)
}

// legacyCharacters は旧 character-window API (get-characters) のレスポンス形状。
type legacyCharacters []struct {
	Name       string `json:"name"`
	League     string `json:"league"`
	Class      string `json:"class"`
	ClassID    int    `json:"classId"`
	Ascendancy string `json:"ascendancy"`
	Level      int    `json:"level"`
	Experience int64  `json:"experience"`
}

// legacyItems は旧 character-window API (get-items) のレスポンス形状。
type legacyItems struct {
	CharacterName string `json:"characterName"`
	Items         []struct {
		Name         string   `json:"name"`
		TypeLine     string   `json:"typeLine"`
		FrameType    int      `json:"frameType"`
		Icon         string   `json:"icon"`
		ItemLevel    int      `json:"ilvl"`
		ExplicitMods []string `json:"explicitMods,omitempty"`
		ImplicitMods []string `json:"implicitMods,omitempty"`
		InventoryID  string   `json:"inventoryId"`
	} `json:"items"`
	Passives struct {
		Hashes      []int `json:"hashes"`
		SkillPoints int   `json:"skillPoints"`
	} `json:"passives"`
}

// legacyRarity は旧 API の frameType (int) を rarity 文字列へ変換する。
var legacyRarity = map[int]string{
	0: "Normal", 1: "Magic", 2: "Rare", 3: "Unique", 4: "Currency",
	5: "Gem", 6: "Divination Card", 7: "Quest", 8: "Prophecy", 9: "Foil",
}

// SessionClient は POESESSID クッキー認証で旧 character-window API を使うクライアント。
// 新アカウントシステムではこの API が Permission Denied になるため、失敗時は
// OAuth2 クライアント(NewClient)へのフォールバックを想定している。
type SessionClient struct {
	httpClient *http.Client
	account    string
}

// NewSessionClient は POESESSID 認証のクライアントを生成する。
func NewSessionClient(account, poesessid string) *SessionClient {
	jar, _ := cookiejar.New(nil)
	parsedURL, _ := url.Parse(webBaseURL)

	if poesessid != "" {
		jar.SetCookies(parsedURL, []*http.Cookie{
			{Name: "POESESSID", Value: poesessid},
		})
	}

	return &SessionClient{
		httpClient: &http.Client{
			Timeout:   30 * time.Second,
			Jar:       jar,
			Transport: &headerTransport{base: http.DefaultTransport},
		},
		account: account,
	}
}

func (c *SessionClient) GetCharacters() ([]models.APICharacter, error) {
	reqURL := fmt.Sprintf("%s/character-window/get-characters?accountName=%s", webBaseURL, url.QueryEscape(c.account))

	resp, err := c.httpClient.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("fetching characters: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var legacy legacyCharacters
	if err := json.Unmarshal(body, &legacy); err != nil {
		return nil, fmt.Errorf("decoding characters: %w", err)
	}

	chars := make([]models.APICharacter, 0, len(legacy))
	for _, lc := range legacy {
		chars = append(chars, models.APICharacter{
			Name:       lc.Name,
			Realm:      "pc",
			Class:      lc.Class,
			League:     lc.League,
			Level:      lc.Level,
			Experience: lc.Experience,
			Ascendancy: lc.Ascendancy,
		})
	}

	return chars, nil
}

func (c *SessionClient) GetCharacterItems(characterName string) (*models.APICharacterItems, error) {
	reqURL := fmt.Sprintf("%s/character-window/get-items?accountName=%s&character=%s",
		webBaseURL, url.QueryEscape(c.account), url.QueryEscape(characterName))

	resp, err := c.httpClient.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("fetching character items: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var legacy legacyItems
	if err := json.Unmarshal(body, &legacy); err != nil {
		return nil, fmt.Errorf("decoding character items: %w", err)
	}

	return convertLegacyItems(&legacy), nil
}

func (c *SessionClient) GetLeagues() ([]models.APILeague, error) {
	return getLeagues(c.httpClient)
}

// convertLegacyItems は旧 API の get-items レスポンスを OAuth2 と同じ
// models.APICharacterItems 形状へ変換する。
func convertLegacyItems(legacy *legacyItems) *models.APICharacterItems {
	toMods := func(mods []string) []models.APIItemMod {
		if len(mods) == 0 {
			return nil
		}
		converted := make([]models.APIItemMod, 0, len(mods))
		for _, m := range mods {
			converted = append(converted, models.APIItemMod{Description: m})
		}
		return converted
	}

	detail := &models.APICharacterItems{}
	detail.Character.Name = legacy.CharacterName
	detail.Character.Equipment = make([]models.APIItem, 0, len(legacy.Items))

	for _, item := range legacy.Items {
		detail.Character.Equipment = append(detail.Character.Equipment, models.APIItem{
			Name:         item.Name,
			TypeLine:     item.TypeLine,
			Rarity:       legacyRarity[item.FrameType],
			Icon:         item.Icon,
			ItemLevel:    item.ItemLevel,
			ExplicitMods: toMods(item.ExplicitMods),
			ImplicitMods: toMods(item.ImplicitMods),
			InventoryID:  item.InventoryID,
		})
	}

	detail.Character.Passives.Hashes = legacy.Passives.Hashes

	return detail
}
