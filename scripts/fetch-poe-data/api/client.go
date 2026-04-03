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

const baseURL = "https://www.pathofexile.com"

type Client struct {
	httpClient *http.Client
	account    string
}

func NewClient(account string, poesessid string) *Client {
	jar, _ := cookiejar.New(nil)
	parsedURL, _ := url.Parse(baseURL)

	if poesessid != "" {
		jar.SetCookies(parsedURL, []*http.Cookie{
			{Name: "POESESSID", Value: poesessid},
		})
	}

	return &Client{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Jar:     jar,
		},
		account: account,
	}
}

func (c *Client) GetCharacters() ([]models.APICharacter, error) {
	url := fmt.Sprintf("%s/character-window/get-characters?accountName=%s", baseURL, c.account)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching characters: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var characters []models.APICharacter
	if err := json.NewDecoder(resp.Body).Decode(&characters); err != nil {
		return nil, fmt.Errorf("decoding characters: %w", err)
	}

	return characters, nil
}

func (c *Client) GetCharacterItems(characterName string) (*models.APICharacterItems, error) {
	url := fmt.Sprintf("%s/character-window/get-items?accountName=%s&character=%s",
		baseURL, c.account, characterName)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching character items: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var items models.APICharacterItems
	if err := json.NewDecoder(resp.Body).Decode(&items); err != nil {
		return nil, fmt.Errorf("decoding character items: %w", err)
	}

	return &items, nil
}

func (c *Client) GetLeagues() ([]models.APILeague, error) {
	url := fmt.Sprintf("%s/api/leagues?type=main&compact=1", baseURL)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching leagues: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var leagues []models.APILeague
	if err := json.NewDecoder(resp.Body).Decode(&leagues); err != nil {
		return nil, fmt.Errorf("decoding leagues: %w", err)
	}

	return leagues, nil
}
