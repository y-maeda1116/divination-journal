package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"strings"
	"time"

	"github.com/poe-diary/fetch-poe-data/models"
)

const baseURL = "https://www.pathofexile.com"

// ErrAuthentication は POESESSID の期限切れ・未設定、または GGG によるIPブロックに
// よる認証失敗を表す。PoE API は無効セッションで /login へリダイレクトするため、
// このエラーを検知したら POESESSID の更新を促す必要がある。
var ErrAuthentication = errors.New("authentication failed: POESESSID may be expired or unset")

// poeHeaders は Cloudflare の bot 判定を回避するためのブラウザ風ヘッダー。
// PoE 公式サイトは Cloudflare で保護されており、Go http.Client のデフォルト UA
// (Go-http-client/1.1) は bot と判定されて「Sorry, you have been blocked」で弾かれる。
// ブラウザ風 UA に偽装することで通過する(PoB 等のサードパーティツールも同手法)。
var poeHeaders = map[string]string{
	"User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	"Accept":          "application/json, text/plain, */*",
	"Accept-Language": "en-US,en;q=0.9",
}

// headerTransport は全リクエストに poeHeaders を注入する RoundTripper。
// GetCharacters 等の各メソッドを変更せず、NewClient で Transport に設定するだけで
// ヘッダー付与を一元管理できる。
type headerTransport struct {
	base http.RoundTripper
}

func (t *headerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	for key, val := range poeHeaders {
		req.Header.Set(key, val)
	}
	return t.base.RoundTrip(req)
}

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
			Timeout:   30 * time.Second,
			Jar:       jar,
			Transport: &headerTransport{base: http.DefaultTransport},
		},
		account: account,
	}
}

// classifyAPIError は API レスポンスを認証エラーと汎用APIエラーに分類する。
// PoE API は無効セッションで /login へ 302 リダイレクトし、Go の http.Client が
// デフォルトでリダイレクトを追従して最終的に 200 OK + ログインページ HTML を返す。
// そのためステータスコードだけではセッション切れを検出できず、最終到達URLの検査が必要。
func classifyAPIError(resp *http.Response, body []byte) error {
	if resp.Request != nil && resp.Request.URL != nil &&
		strings.Contains(resp.Request.URL.Path, "/login") {
		return fmt.Errorf("%w (redirected to login page)", ErrAuthentication)
	}
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return fmt.Errorf("%w (status %d): %s", ErrAuthentication, resp.StatusCode, string(body))
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

func (c *Client) GetCharacters() ([]models.APICharacter, error) {
	url := fmt.Sprintf("%s/character-window/get-characters?accountName=%s", baseURL, c.account)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching characters: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var characters []models.APICharacter
	if err := json.Unmarshal(body, &characters); err != nil {
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

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var items models.APICharacterItems
	if err := json.Unmarshal(body, &items); err != nil {
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

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var leagues []models.APILeague
	if err := json.Unmarshal(body, &leagues); err != nil {
		return nil, fmt.Errorf("decoding leagues: %w", err)
	}

	return leagues, nil
}
