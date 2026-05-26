package fetcher

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const DefaultUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 YoungCertiCrawler/1.0"

type SleepFunc func(context.Context, time.Duration) error

type ClientConfig struct {
	HTTPClient  *http.Client
	UserAgent   string
	Interval    time.Duration
	RetryDelay  time.Duration
	MaxRetries  int
	Sleep       SleepFunc
	Logf        func(string, ...any)
	InitialWait bool
}

type Client struct {
	httpClient  *http.Client
	userAgent   string
	interval    time.Duration
	retryDelay  time.Duration
	maxRetries  int
	sleep       SleepFunc
	logf        func(string, ...any)
	initialWait bool
	requested   bool
}

func New(cfg ClientConfig) *Client {
	httpClient := cfg.HTTPClient
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	userAgent := cfg.UserAgent
	if userAgent == "" {
		userAgent = DefaultUserAgent
	}
	sleep := cfg.Sleep
	if sleep == nil {
		sleep = sleepContext
	}
	return &Client{
		httpClient:  httpClient,
		userAgent:   userAgent,
		interval:    cfg.Interval,
		retryDelay:  cfg.RetryDelay,
		maxRetries:  cfg.MaxRetries,
		sleep:       sleep,
		logf:        cfg.Logf,
		initialWait: cfg.InitialWait,
	}
}

func (c *Client) Fetch(ctx context.Context, url string) ([]byte, error) {
	if err := c.waitForTurn(ctx); err != nil {
		return nil, err
	}
	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			c.log("retrying %s after %s (attempt %d/%d)", url, c.retryDelay, attempt, c.maxRetries)
			if err := c.sleep(ctx, c.retryDelay); err != nil {
				return nil, err
			}
		}
		body, retryable, err := c.fetchOnce(ctx, url)
		if err == nil && !retryable {
			return body, nil
		}
		if err != nil {
			lastErr = err
		} else {
			lastErr = fmt.Errorf("retryable response from %s", url)
		}
		if !retryable {
			break
		}
		if attempt < c.maxRetries {
			c.log("retryable response from %s; waiting %s before retry", url, c.retryDelay)
		}
	}
	return nil, lastErr
}

func (c *Client) waitForTurn(ctx context.Context) error {
	if c.interval <= 0 {
		c.requested = true
		return nil
	}
	if !c.requested && !c.initialWait {
		c.requested = true
		return nil
	}
	c.requested = true
	return c.sleep(ctx, c.interval)
}

func (c *Client) fetchOnce(ctx context.Context, url string) ([]byte, bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, false, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", c.userAgent)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, true, fmt.Errorf("get %s: %w", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, true, fmt.Errorf("read %s: %w", url, err)
	}
	if isRetryableStatus(resp.StatusCode) || hasSoftRateLimit(body) {
		return body, true, nil
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return nil, false, fmt.Errorf("get %s: status %d", url, resp.StatusCode)
	}
	return body, false, nil
}

func isRetryableStatus(status int) bool {
	return status == http.StatusTooManyRequests || status >= 500
}

func hasSoftRateLimit(body []byte) bool {
	text := strings.ToLower(string(body))
	if strings.Contains(text, "qa-question") || strings.Contains(text, "qa_explanation") {
		return false
	}
	needles := []string{
		"you are being rate limited",
		"checking your browser before accessing",
		"attention required",
		"access denied",
		"temporarily blocked",
	}
	for _, needle := range needles {
		if strings.Contains(text, needle) {
			return true
		}
	}
	return false
}

func sleepContext(ctx context.Context, d time.Duration) error {
	if d <= 0 {
		return nil
	}
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func (c *Client) log(format string, args ...any) {
	if c.logf != nil {
		c.logf(format, args...)
	}
}
