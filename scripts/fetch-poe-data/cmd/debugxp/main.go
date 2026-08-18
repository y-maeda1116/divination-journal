// debugxp は一時的な調査用コマンド。旧 character-window API (get-characters) の
// 生レスポンスをダンプし、experience フィールドの実在を確認する。
// 確認後にブランチごと削除する。secret は環境変数から読み、出力しない。
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"sort"
	"time"

	"github.com/poe-diary/fetch-poe-data/api"
)

const debugUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

func main() {
	account := os.Getenv("POE_ACCOUNT_NAME")
	sessID := os.Getenv("POESESSID")
	if account == "" || sessID == "" {
		fmt.Println("missing POE_ACCOUNT_NAME / POESESSID env")
		os.Exit(1)
	}

	jar, err := cookiejar.New(nil)
	if err != nil {
		fmt.Println("cookiejar:", err)
		os.Exit(1)
	}
	base, _ := url.Parse("https://www.pathofexile.com")
	jar.SetCookies(base, []*http.Cookie{{Name: "POESESSID", Value: sessID}})

	client := &http.Client{Timeout: 30 * time.Second, Jar: jar}

	req, err := http.NewRequest(http.MethodGet,
		"https://www.pathofexile.com/character-window/get-characters?accountName="+url.QueryEscape(account), nil)
	if err != nil {
		fmt.Println("request:", err)
		os.Exit(1)
	}
	req.Header.Set("User-Agent", debugUA)
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("do:", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("status:", resp.StatusCode)
	fmt.Println("body length:", len(body))
	head := body
	if len(head) > 600 {
		head = head[:600]
	}
	fmt.Println("body head:", string(head))

	var entries []map[string]any
	if err := json.Unmarshal(body, &entries); err != nil {
		fmt.Println("not an array:", err)
		return
	}
	fmt.Println("entry count:", len(entries))
	if len(entries) == 0 {
		return
	}

	keys := make([]string, 0, len(entries[0]))
	for k := range entries[0] {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	fmt.Println("keys of first entry:", keys)

	for i, e := range entries {
		if i >= 5 {
			break
		}
		fmt.Printf("entry[%d]: name=%v league=%v level=%v experience=%v (type %T)\n",
			i, e["name"], e["league"], e["level"], e["experience"], e["experience"])
	}

	dumpOAuth2Experience()
}

// dumpOAuth2Experience は OAuth2 /character が experience を返すか、また
// 保存済み refresh token が現在有効かを確認する。
func dumpOAuth2Experience() {
	clientID := os.Getenv("POE_CLIENT_ID")
	refreshToken := os.Getenv("POE_REFRESH_TOKEN")
	if clientID == "" || refreshToken == "" {
		fmt.Println("oauth2: POE_CLIENT_ID / POE_REFRESH_TOKEN not set")
		return
	}

	token, err := api.RefreshAccessToken(clientID, refreshToken)
	if err != nil {
		fmt.Println("oauth2 refresh failed:", err)
		return
	}
	fmt.Println("oauth2: access token obtained")

	chars, err := api.NewClient(token.AccessToken).GetCharacters()
	if err != nil {
		fmt.Println("oauth2 get characters failed:", err)
		return
	}
	fmt.Println("oauth2 entry count:", len(chars))
	for i, c := range chars {
		if i >= 5 {
			break
		}
		fmt.Printf("oauth2[%d]: name=%s league=%s level=%d experience=%d\n",
			i, c.Name, c.League, c.Level, c.Experience)
	}
}
