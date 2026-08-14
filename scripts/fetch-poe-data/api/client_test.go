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
