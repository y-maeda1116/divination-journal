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
}
