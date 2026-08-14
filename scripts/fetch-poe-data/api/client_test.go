package api

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestClassifyAPIError(t *testing.T) {
	tests := []struct {
		name     string
		status   int
		path     string
		wantAuth bool // ErrAuthentication に一致すべきか
		wantErr  bool // 何らかのエラーを期待するか(200 成功は false)
	}{
		{name: "200 success", status: http.StatusOK, path: "/character-window/get-characters", wantAuth: false, wantErr: false},
		{name: "401 unauthorized", status: http.StatusUnauthorized, path: "/character-window/get-characters", wantAuth: true, wantErr: true},
		{name: "403 forbidden", status: http.StatusForbidden, path: "/character-window/get-characters", wantAuth: true, wantErr: true},
		{name: "login redirect (200 + HTML)", status: http.StatusOK, path: "/login", wantAuth: true, wantErr: true},
		{name: "500 server error", status: http.StatusInternalServerError, path: "/character-window/get-characters", wantAuth: false, wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := &http.Response{
				StatusCode: tt.status,
				Request: &http.Request{
					URL: &url.URL{Path: tt.path},
				},
			}
			err := classifyAPIError(resp, []byte("body"))

			if tt.wantErr && err == nil {
				t.Fatalf("expected an error, got nil")
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("expected nil error, got %v", err)
			}
			if tt.wantAuth && !errors.Is(err, ErrAuthentication) {
				t.Errorf("expected ErrAuthentication, got %v", err)
			}
			if !tt.wantAuth && tt.wantErr && errors.Is(err, ErrAuthentication) {
				t.Errorf("did not expect ErrAuthentication, got %v", err)
			}
		})
	}
}

// TestHeaderTransportSetsBrowserHeaders は headerTransport が全リクエストに
// ブラウザ風ヘッダーを注入することを検証する。Cloudflare はデフォルトの Go UA
// (Go-http-client/1.1) を bot と判定してブロックするため、UA 偽装が必須。
func TestHeaderTransportSetsBrowserHeaders(t *testing.T) {
	var gotUA, gotAccept, gotAcceptLang string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotUA = r.Header.Get("User-Agent")
		gotAccept = r.Header.Get("Accept")
		gotAcceptLang = r.Header.Get("Accept-Language")
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	client := &http.Client{Transport: &headerTransport{base: http.DefaultTransport}}
	resp, err := client.Get(srv.URL)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	defer resp.Body.Close()

	if !strings.HasPrefix(gotUA, "Mozilla/5.0") {
		t.Errorf("expected browser User-Agent starting with Mozilla/5.0, got %q", gotUA)
	}
	if gotAccept == "" {
		t.Errorf("expected Accept header to be set, got empty")
	}
	if gotAcceptLang == "" {
		t.Errorf("expected Accept-Language header to be set, got empty")
	}
}

// TestGetCharactersUnwrapsResponse は GET /character の {characters: [...]} ラッパーを
// unwrap し、Bearer トークンを送ることを検証する。
func TestGetCharactersUnwrapsResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/character" {
			t.Errorf("expected path /character, got %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer test-token" {
			t.Errorf("expected Bearer test-token, got %q", got)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"characters":[{"id":"abc","name":"MyChar","realm":"pc","class":"Witch","league":"Standard","level":90,"experience":123456}]}`))
	}))
	defer srv.Close()

	orig := baseURL
	baseURL = srv.URL
	defer func() { baseURL = orig }()

	client := NewClient("test-token")
	chars, err := client.GetCharacters()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(chars) != 1 {
		t.Fatalf("expected 1 character, got %d", len(chars))
	}
	if chars[0].Name != "MyChar" || chars[0].League != "Standard" || chars[0].Level != 90 {
		t.Errorf("unexpected character: %+v", chars[0])
	}
}

// TestGetCharacterItemsParsesDetail は GET /character/{name} のレスポンス形状
// ({character: {equipment: [...], passives: {hashes: [...]}}}) のパースを検証する。
func TestGetCharacterItemsParsesDetail(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/character/MyChar" {
			t.Errorf("expected path /character/MyChar, got %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"character":{"id":"abc","name":"MyChar","class":"Witch","league":"Standard","level":90,"equipment":[{"name":"Tabula","typeLine":"Simple Robe","rarity":"Unique","icon":"https://example.com/i.png","ilvl":70,"explicitMods":[{"description":"+1 to Level of Socketed Gems"}],"inventoryId":"BodyArmour"}],"passives":{"hashes":[1,2,3]}}}`))
	}))
	defer srv.Close()

	orig := baseURL
	baseURL = srv.URL
	defer func() { baseURL = orig }()

	client := NewClient("test-token")
	detail, err := client.GetCharacterItems("MyChar")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if detail.Character.Name != "MyChar" {
		t.Errorf("expected character name MyChar, got %q", detail.Character.Name)
	}
	if len(detail.Character.Equipment) != 1 {
		t.Fatalf("expected 1 equipment item, got %d", len(detail.Character.Equipment))
	}
	eq := detail.Character.Equipment[0]
	if eq.Rarity != "Unique" || eq.InventoryID != "BodyArmour" {
		t.Errorf("unexpected item: %+v", eq)
	}
	if len(eq.ExplicitMods) != 1 || eq.ExplicitMods[0].Description != "+1 to Level of Socketed Gems" {
		t.Errorf("unexpected explicit mods: %+v", eq.ExplicitMods)
	}
	if len(detail.Character.Passives.Hashes) != 3 {
		t.Errorf("expected 3 passive hashes, got %d", len(detail.Character.Passives.Hashes))
	}
}

// TestGetCharactersAuthError は 401 が ErrAuthentication として分類されることを検証する。
func TestGetCharactersAuthError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"error":{"code":1,"message":"Unauthorized"}}`, http.StatusUnauthorized)
	}))
	defer srv.Close()

	orig := baseURL
	baseURL = srv.URL
	defer func() { baseURL = orig }()

	client := NewClient("expired-token")
	if _, err := client.GetCharacters(); !errors.Is(err, ErrAuthentication) {
		t.Errorf("expected ErrAuthentication, got %v", err)
	}
}
