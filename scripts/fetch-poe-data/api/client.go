package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/poe-diary/fetch-poe-data/models"
)

// テストで httptest サーバーに差し替えられるようパッケージ変数としている。
var (
	// baseURL は OAuth2 API。旧 character-window API とは異なり Bearer トークン認証。
	baseURL = "https://api.pathofexile.com"
	// webBaseURL は無認証の公開リーグ API(旧来からのエンドポイント)。
	webBaseURL = "https://www.pathofexile.com"
)

// ErrAuthentication はアクセストークンの期限切れ・失効、またはスコープ不足に
// よる認証失敗を表す。このエラーを検知したら再認証(auth サブコマンド)を促す。
var ErrAuthentication = errors.New("authentication failed: access token may be expired or revoked")

// poeHeaders は Cloudflare の bot 判定を回避するためのブラウザ風ヘッダー。
// PoE 公式サイトは Cloudflare で保護されており、Go http.Client のデフォルト UA
// (Go-http-client/1.1) は bot と判定されて「Sorry, you have been blocked」で弾かれる。
// ブラウザ風 UA に偽装することで通過する(PoB 等のサードパーティツールも同手法)。
var poeHeaders = map[string]string{
	"User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	"Accept":          "application/json, text/plain, */*",
	"Accept-Language": "en-US,en;q=0.9",
}

// headerTransport は全リクエストに poeHeaders と Bearer トークンを注入する
// RoundTripper。GetCharacters 等の各メソッドを変更せず、NewClient で Transport に
// 設定するだけでヘッダー付与を一元管理できる。
type headerTransport struct {
	base http.RoundTripper
}

func (t *headerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	for key, val := range poeHeaders {
		req.Header.Set(key, val)
	}
	return t.base.RoundTrip(req)
}

// bearerTransport は Authorization ヘッダーを注入する RoundTripper。
type bearerTransport struct {
	token string
	base  http.RoundTripper
}

func (t *bearerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("Authorization", "Bearer "+t.token)
	return t.base.RoundTrip(req)
}

type Client struct {
	httpClient *http.Client
	// publicClient は無認証の公開エンドポイント(リーグ等)用。アクセストークンを
	// 別ホストへ送らないため、Bearer ヘッダーなしのクライアントを使う。
	publicClient *http.Client
}

// NewClient はアクセストークンで認証される OAuth2 API クライアントを生成する。
func NewClient(accessToken string) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout:   30 * time.Second,
			Transport: &bearerTransport{token: accessToken, base: &headerTransport{base: http.DefaultTransport}},
		},
		publicClient: &http.Client{
			Timeout:   30 * time.Second,
			Transport: &headerTransport{base: http.DefaultTransport},
		},
	}
}

// classifyAPIError は API レスポンスを認証エラーと汎用APIエラーに分類する。
// OAuth2 API はトークン無効で 401、スコープ不足で 403 を返す。
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

// GetCharacters は GET /character でキャラクター一覧を取得する。
// スコープ: account:characters
func (c *Client) GetCharacters() ([]models.APICharacter, error) {
	url := baseURL + "/character"

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching characters: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var wrapper models.APICharacters
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, fmt.Errorf("decoding characters: %w", err)
	}

	return wrapper.Characters, nil
}

// GetCharacterItems は GET /character/{name} で装備・パッシブ情報を取得する。
// スコープ: account:characters
func (c *Client) GetCharacterItems(characterName string) (*models.APICharacterItems, error) {
	url := fmt.Sprintf("%s/character/%s", baseURL, url.PathEscape(characterName))

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetching character items: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if err := classifyAPIError(resp, body); err != nil {
		return nil, err
	}

	var detail models.APICharacterItems
	if err := json.Unmarshal(body, &detail); err != nil {
		return nil, fmt.Errorf("decoding character items: %w", err)
	}

	return &detail, nil
}

// GetLeagues は公開リーグ API(無認証)でリーグ一覧を取得する。
func (c *Client) GetLeagues() ([]models.APILeague, error) {
	url := webBaseURL + "/api/leagues?type=main&compact=1"

	resp, err := c.publicClient.Get(url)
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
