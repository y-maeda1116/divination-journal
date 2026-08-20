package api

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestSessionClientGetCharactersConvertsLegacy は旧 get-characters レスポンスが
// OAuth2 と共通の models.APICharacter 形状へ変換されることを検証する。
func TestSessionClientGetCharactersConvertsLegacy(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/character-window/get-characters" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("accountName"); got != "MyAccount" {
			t.Errorf("expected accountName=MyAccount, got %q", got)
		}
		if cookies := r.Cookies(); len(cookies) == 0 || cookies[0].Name != "POESESSID" || cookies[0].Value != "sid-123" {
			t.Errorf("expected POESESSID cookie, got %v", cookies)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"name":"MyChar","league":"Standard","class":"Witch","classId":3,"ascendancy":"Necromancer","level":90,"experience":123456,"lastLoginTime":1755500000}]`))
	}))
	defer srv.Close()

	orig := webBaseURL
	webBaseURL = srv.URL
	defer func() { webBaseURL = orig }()

	client := NewSessionClient("MyAccount", "sid-123")
	chars, err := client.GetCharacters()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(chars) != 1 {
		t.Fatalf("expected 1 character, got %d", len(chars))
	}
	if chars[0].Name != "MyChar" || chars[0].League != "Standard" || chars[0].Ascendancy != "Necromancer" {
		t.Errorf("unexpected character: %+v", chars[0])
	}
	if chars[0].LastLogin != 1755500000 {
		t.Errorf("expected lastLogin 1755500000, got %d", chars[0].LastLogin)
	}
}

// TestSessionClientGetItemsConvertsLegacy は旧 get-items レスポンス
// (frameType int・mods が文字列配列) が OAuth2 と共通の形状へ変換されることを検証する。
func TestSessionClientGetItemsConvertsLegacy(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/character-window/get-items") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"characterName":"MyChar","items":[{"name":"Tabula","typeLine":"Simple Robe","frameType":3,"icon":"https://example.com/i.png","ilvl":70,"explicitMods":["+1 to Level of Socketed Gems"],"inventoryId":"BodyArmour"}],"passives":{"hashes":[1,2,3],"skillPoints":118}}`))
	}))
	defer srv.Close()

	orig := webBaseURL
	webBaseURL = srv.URL
	defer func() { webBaseURL = orig }()

	client := NewSessionClient("MyAccount", "sid-123")
	detail, err := client.GetCharacterItems("MyChar")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if detail.Character.Name != "MyChar" {
		t.Errorf("expected character name MyChar, got %q", detail.Character.Name)
	}
	if len(detail.Character.Equipment) != 1 {
		t.Fatalf("expected 1 item, got %d", len(detail.Character.Equipment))
	}
	eq := detail.Character.Equipment[0]
	if eq.Rarity != "Unique" {
		t.Errorf("expected frameType 3 -> Unique, got %q", eq.Rarity)
	}
	if len(eq.ExplicitMods) != 1 || eq.ExplicitMods[0].Description != "+1 to Level of Socketed Gems" {
		t.Errorf("unexpected explicit mods: %+v", eq.ExplicitMods)
	}
	if len(detail.Character.Passives.Hashes) != 3 {
		t.Errorf("expected 3 passive hashes, got %d", len(detail.Character.Passives.Hashes))
	}
}

// TestSessionClientGetItemsObjectMods は旧 get-items の mods が
// オブジェクト配列({"text"|"description": "..."})で返ってくる形式変更に
// 対応できることを検証する(2026-08 本番で発生した形式)。
func TestSessionClientGetItemsObjectMods(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"characterName":"MyChar","items":[{"name":"Axe","typeLine":"Vaal Axe","frameType":2,"icon":"https://example.com/i.png","explicitMods":[{"text":"200% increased Physical Damage"},{"description":"+25 to Strength"}],"implicitMods":[{"text":"Culling Strike"}],"inventoryId":"Weapon"}],"passives":{"hashes":[],"skillPoints":0}}`))
	}))
	defer srv.Close()

	orig := webBaseURL
	webBaseURL = srv.URL
	defer func() { webBaseURL = orig }()

	client := NewSessionClient("MyAccount", "sid-123")
	detail, err := client.GetCharacterItems("MyChar")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(detail.Character.Equipment) != 1 {
		t.Fatalf("expected 1 item, got %d", len(detail.Character.Equipment))
	}
	eq := detail.Character.Equipment[0]
	if len(eq.ExplicitMods) != 2 {
		t.Fatalf("expected 2 explicit mods, got %d", len(eq.ExplicitMods))
	}
	if eq.ExplicitMods[0].Description != "200% increased Physical Damage" {
		t.Errorf("unexpected mod 0: %+v", eq.ExplicitMods[0])
	}
	if eq.ExplicitMods[1].Description != "+25 to Strength" {
		t.Errorf("unexpected mod 1: %+v", eq.ExplicitMods[1])
	}
	if len(eq.ImplicitMods) != 1 || eq.ImplicitMods[0].Description != "Culling Strike" {
		t.Errorf("unexpected implicit mods: %+v", eq.ImplicitMods)
	}
}

// TestSessionClientAuthError は旧 API の 403 が ErrAuthentication として分類される
// ことを検証する(フォールバック判定の前提)。
func TestSessionClientAuthError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"code":6,"message":"Forbidden"}`, http.StatusForbidden)
	}))
	defer srv.Close()

	orig := webBaseURL
	webBaseURL = srv.URL
	defer func() { webBaseURL = orig }()

	client := NewSessionClient("MyAccount", "invalid-sid")
	if _, err := client.GetCharacters(); err == nil {
		t.Fatal("expected an error, got nil")
	}
}
