package fetcher

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestFetchUsesBrowserUserAgentAndRetries429Once(t *testing.T) {
	var attempts int
	var userAgent string
	var logs []string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		userAgent = r.UserAgent()
		if attempts == 1 {
			http.Error(w, "too much request", http.StatusTooManyRequests)
			return
		}
		_, _ = w.Write([]byte("<html>ok</html>"))
	}))
	defer server.Close()

	var sleeps []time.Duration
	client := New(ClientConfig{
		HTTPClient:  server.Client(),
		Interval:    2 * time.Minute,
		RetryDelay:  10 * time.Minute,
		MaxRetries:  1,
		UserAgent:   DefaultUserAgent,
		Sleep:       func(_ context.Context, d time.Duration) error { sleeps = append(sleeps, d); return nil },
		Logf:        func(format string, args ...any) { logs = append(logs, format) },
		InitialWait: false,
	})

	body, err := client.Fetch(context.Background(), server.URL)
	if err != nil {
		t.Fatalf("Fetch returned error: %v", err)
	}
	if string(body) != "<html>ok</html>" {
		t.Fatalf("body = %q, want ok html", string(body))
	}
	if attempts != 2 {
		t.Fatalf("attempts = %d, want 2", attempts)
	}
	if userAgent == "" || userAgent == "Go-http-client/1.1" {
		t.Fatalf("user agent = %q, want browser-like UA", userAgent)
	}
	if len(sleeps) != 1 || sleeps[0] != 10*time.Minute {
		t.Fatalf("sleeps = %v, want [10m]", sleeps)
	}
	if len(logs) == 0 {
		t.Fatal("logs len = 0, want retry progress logs")
	}
}

func TestFetchTreatsSoftRateLimitBodyAsRetryable(t *testing.T) {
	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts == 1 {
			_, _ = w.Write([]byte("you are being rate limited"))
			return
		}
		_, _ = w.Write([]byte("<html>ok</html>"))
	}))
	defer server.Close()

	client := New(ClientConfig{
		HTTPClient:  server.Client(),
		RetryDelay:  10 * time.Minute,
		MaxRetries:  1,
		UserAgent:   DefaultUserAgent,
		Sleep:       func(context.Context, time.Duration) error { return nil },
		InitialWait: false,
	})

	if _, err := client.Fetch(context.Background(), server.URL); err != nil {
		t.Fatalf("Fetch returned error: %v", err)
	}
	if attempts != 2 {
		t.Fatalf("attempts = %d, want 2", attempts)
	}
}

func TestFetchDoesNotTreatQuestionTextTooManyRequestsAsRetryable(t *testing.T) {
	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		_, _ = w.Write([]byte(`<div class="qa-question">"429 Too Many Requests" 오류 응답을 받았습니다.</div><div class="qa_explanation">정상 문제 해설</div>`))
	}))
	defer server.Close()

	client := New(ClientConfig{
		HTTPClient:  server.Client(),
		MaxRetries:  1,
		UserAgent:   DefaultUserAgent,
		Sleep:       func(context.Context, time.Duration) error { return nil },
		InitialWait: false,
	})

	if _, err := client.Fetch(context.Background(), server.URL); err != nil {
		t.Fatalf("Fetch returned error: %v", err)
	}
	if attempts != 1 {
		t.Fatalf("attempts = %d, want 1", attempts)
	}
}

func TestFetchFailsAfterSingleRetry(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "rate limited", http.StatusTooManyRequests)
	}))
	defer server.Close()

	client := New(ClientConfig{
		HTTPClient:  server.Client(),
		RetryDelay:  time.Nanosecond,
		MaxRetries:  1,
		UserAgent:   DefaultUserAgent,
		Sleep:       func(context.Context, time.Duration) error { return nil },
		InitialWait: false,
	})

	if _, err := client.Fetch(context.Background(), server.URL); err == nil {
		t.Fatal("Fetch returned nil, want retry exhaustion error")
	}
}
