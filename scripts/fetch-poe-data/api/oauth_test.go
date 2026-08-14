package api

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

// TestGenerateCodeVerifier は PKCE code_verifier の要件(43文字以上・ランダム性)を検証する。
// 仕様は32byte以上のエントロピーを要求し、base64url エンコードで43文字となる。
func TestGenerateCodeVerifier(t *testing.T) {
	verifier, err := generateCodeVerifier()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(verifier) < 43 {
		t.Errorf("expected at least 43 chars, got %d", len(verifier))
	}
	if strings.ContainsAny(verifier, "+/=") {
		t.Errorf("expected base64url encoding without +,/,= padding: %q", verifier)
	}

	// ランダム性: 2回生成して異なる値であること
	other, _ := generateCodeVerifier()
	if verifier == other {
		t.Error("expected distinct verifiers across calls")
	}
}

// TestComputeCodeChallenge は S256 方式の算出(SHA256 → base64url)を検証する。
func TestComputeCodeChallenge(t *testing.T) {
	verifier := "test-verifier-string-with-enough-entropy-1234567890"
	sum := sha256.Sum256([]byte(verifier))
	want := base64.RawURLEncoding.EncodeToString(sum[:])

	if got := computeCodeChallenge(verifier); got != want {
		t.Errorf("expected %q, got %q", want, got)
	}
}

// TestBuildAuthorizeURL は認可 URL が PKCE に必要なパラメータを全て含むことを検証する。
func TestBuildAuthorizeURL(t *testing.T) {
	authorizeURL := BuildAuthorizeURL("my-client", "http://127.0.0.1:14500/callback", "st4te", "ch4llenge")

	for _, want := range []string{
		"client_id=my-client",
		"response_type=code",
		"scope=" + url.QueryEscape(strings.Join(RequiredScopes, " ")),
		"state=st4te",
		"code_challenge=ch4llenge",
		"code_challenge_method=S256",
	} {
		if !strings.Contains(authorizeURL, want) {
			t.Errorf("authorize URL missing %q: %s", want, authorizeURL)
		}
	}
	if !strings.HasPrefix(authorizeURL, authorizeEndpoint) {
		t.Errorf("expected URL to start with %s: %s", authorizeEndpoint, authorizeURL)
	}
}

// TestRefreshAccessTokenSuccess は refresh token grant の正常系を検証する。
func TestRefreshAccessTokenSuccess(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if err := r.ParseForm(); err != nil {
			t.Errorf("failed to parse form: %v", err)
		}
		if got := r.PostForm.Get("grant_type"); got != "refresh_token" {
			t.Errorf("expected grant_type=refresh_token, got %q", got)
		}
		if got := r.PostForm.Get("client_id"); got != "my-client" {
			t.Errorf("expected client_id=my-client, got %q", got)
		}
		if got := r.PostForm.Get("refresh_token"); got != "rt-123" {
			t.Errorf("expected refresh_token=rt-123, got %q", got)
		}
		// public client なので client_secret は送られてこない
		if got := r.PostForm.Get("client_secret"); got != "" {
			t.Errorf("public client must not send client_secret, got %q", got)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"access_token":  "at-456",
			"refresh_token": "rt-789",
			"expires_in":    36000,
			"token_type":    "Bearer",
		})
	}))
	defer srv.Close()

	orig := tokenEndpoint
	tokenEndpoint = srv.URL
	defer func() { tokenEndpoint = orig }()

	token, err := RefreshAccessToken("my-client", "rt-123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token.AccessToken != "at-456" {
		t.Errorf("expected access token at-456, got %q", token.AccessToken)
	}
	if token.RefreshToken != "rt-789" {
		t.Errorf("expected refresh token rt-789, got %q", token.RefreshToken)
	}
}

// TestRefreshAccessTokenError はトークンエンドポイントのエラーが ErrOAuth で
// ラップされることを検証する。
func TestRefreshAccessTokenError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, `{"error":"invalid_grant"}`, http.StatusBadRequest)
	}))
	defer srv.Close()

	orig := tokenEndpoint
	tokenEndpoint = srv.URL
	defer func() { tokenEndpoint = orig }()

	if _, err := RefreshAccessToken("my-client", "expired"); err == nil {
		t.Fatal("expected an error, got nil")
	}
}
