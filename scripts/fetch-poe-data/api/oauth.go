package api

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// OAuth 2.1 エンドポイント。テストで httptest サーバーに差し替えられるよう
// パッケージ変数としている。
var (
	authorizeEndpoint = "https://www.pathofexile.com/oauth/authorize"
	tokenEndpoint     = "https://www.pathofexile.com/oauth/token"
)

// RequiredScopes はキャラクター・リーグデータ取得に必要なスコープ。
var RequiredScopes = []string{"account:characters", "account:leagues"}

// ErrOAuth は OAuth トークン取得の失敗を表す。
var ErrOAuth = errors.New("oauth token request failed")

// TokenResponse は /oauth/token のレスポンス。
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// generateCodeVerifier は PKCE の code_verifier を生成する。
// 仕様上 32 byte 以上のエントロピーが必要なため、32 byte のランダム値を
// base64url エンコードして返す。
func generateCodeVerifier() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generating code verifier: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// computeCodeChallenge は code_verifier から S256 方式の code_challenge を算出する。
func computeCodeChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

// generateState は CSRF 防止用の state を生成する。
func generateState() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generating state: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// BuildAuthorizeURL は PKCE 付きの認可 URL を構築する。
func BuildAuthorizeURL(clientID, redirectURI, state, codeChallenge string) string {
	q := url.Values{}
	q.Set("client_id", clientID)
	q.Set("response_type", "code")
	q.Set("scope", strings.Join(RequiredScopes, " "))
	q.Set("state", state)
	q.Set("redirect_uri", redirectURI)
	q.Set("code_challenge", codeChallenge)
	q.Set("code_challenge_method", "S256")

	return authorizeEndpoint + "?" + q.Encode()
}

// RunLocalAuth は Authorization Code + PKCE フローをローカルで完結させる。
// 127.0.0.1 の指定ポートで /callback を待ち受け、認可コードをトークンに交換する。
// 認可 URL を標準出力に表示するので呼び出し元でブラウザを開いてもらう。
// authorization code の有効期限は30秒のため、callback 受信後すぐ交換する。
func RunLocalAuth(clientID string, port int) (*TokenResponse, error) {
	verifier, err := generateCodeVerifier()
	if err != nil {
		return nil, err
	}
	state, err := generateState()
	if err != nil {
		return nil, err
	}

	redirectURI := fmt.Sprintf("http://127.0.0.1:%d/callback", port)
	authorizeURL := BuildAuthorizeURL(clientID, redirectURI, state, computeCodeChallenge(verifier))

	fmt.Printf("Open the following URL in your browser to authorize:\n\n%s\n\n", authorizeURL)
	fmt.Printf("Waiting for authorization callback on %s ...\n", redirectURI)

	type callbackResult struct {
		code string
		err  error
	}
	resultCh := make(chan callbackResult, 1)

	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		if got := query.Get("state"); got != state {
			http.Error(w, "state mismatch", http.StatusBadRequest)
			resultCh <- callbackResult{err: fmt.Errorf("state mismatch: possible CSRF")}
			return
		}
		if errMsg := query.Get("error"); errMsg != "" {
			http.Error(w, "authorization denied", http.StatusBadRequest)
			resultCh <- callbackResult{err: fmt.Errorf("authorization error: %s: %s", errMsg, query.Get("error_description"))}
			return
		}
		code := query.Get("code")
		if code == "" {
			http.Error(w, "missing code", http.StatusBadRequest)
			resultCh <- callbackResult{err: fmt.Errorf("callback had no authorization code")}
			return
		}

		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		fmt.Fprintln(w, "Authorization received. You can close this tab and return to the terminal.")

		resultCh <- callbackResult{code: code}
	})

	// ローカルループバック限定だが、接続を開きっぱなしにされるリソース枯渇
	// (slowloris 系) を防ぐためタイムアウトを設定する。
	server := &http.Server{
		Addr:         fmt.Sprintf("127.0.0.1:%d", port),
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			resultCh <- callbackResult{err: fmt.Errorf("local callback server: %w", err)}
		}
	}()
	defer func() {
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()

	select {
	case res := <-resultCh:
		if res.err != nil {
			return nil, res.err
		}
		return exchangeCode(clientID, res.code, redirectURI, verifier)
	case <-time.After(10 * time.Minute):
		return nil, fmt.Errorf("timed out waiting for authorization callback")
	}
}

// exchangeCode は認可コードをアクセストークンに交換する(public client なので
// client_secret は送らない)。
func exchangeCode(clientID, code, redirectURI, verifier string) (*TokenResponse, error) {
	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("grant_type", "authorization_code")
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)
	form.Set("code_verifier", verifier)

	return postTokenRequest(form)
}

// RefreshAccessToken は refresh token grant で新しいアクセストークンを取得する。
// public client なので client_secret は送らない。
func RefreshAccessToken(clientID, refreshToken string) (*TokenResponse, error) {
	form := url.Values{}
	form.Set("client_id", clientID)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)

	return postTokenRequest(form)
}

// postTokenRequest は /oauth/token への form リクエスト共通処理。
func postTokenRequest(form url.Values) (*TokenResponse, error) {
	req, err := http.NewRequest(http.MethodPost, tokenEndpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("building token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	httpClient := &http.Client{
		Timeout:   30 * time.Second,
		Transport: &headerTransport{base: http.DefaultTransport},
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrOAuth, err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w (status %d): %s", ErrOAuth, resp.StatusCode, string(body))
	}

	var token TokenResponse
	if err := json.Unmarshal(body, &token); err != nil {
		return nil, fmt.Errorf("decoding token response: %w", err)
	}
	if token.AccessToken == "" {
		return nil, fmt.Errorf("%w: response had no access_token", ErrOAuth)
	}

	return &token, nil
}
