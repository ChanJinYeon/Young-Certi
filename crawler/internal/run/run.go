package run

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"young-certi/crawler/internal/parser"
	"young-certi/crawler/internal/pool"
)

type FetchFunc func(context.Context, int, string) ([]byte, error)

type Config struct {
	ExamSlug    string
	DisplayName string
	Version     string
	BaseURL     string
	PageStart   int
	PageEnd     int
	PageDir     string
	Output      string
	Fetch       FetchFunc
	Now         func() time.Time
	Logf        func(string, ...any)
}

func Crawl(ctx context.Context, cfg Config) error {
	if cfg.Fetch == nil {
		return fmt.Errorf("fetch function is required")
	}
	if cfg.Now == nil {
		cfg.Now = time.Now
	}
	pages, err := LoadPages(cfg.PageDir)
	if err != nil {
		return err
	}
	start := NextPage(pages, cfg.PageStart)
	for page := start; page <= cfg.PageEnd; page++ {
		url := fmt.Sprintf("%s?p=%d", cfg.BaseURL, page)
		logf(cfg, "fetch page %d: %s", page, url)
		body, err := cfg.Fetch(ctx, page, url)
		if err != nil {
			return fmt.Errorf("fetch page %d: %w", page, err)
		}
		questions, err := parser.ParseQuestions(cfg.ExamSlug, body)
		if err != nil {
			return fmt.Errorf("parse page %d: %w", page, err)
		}
		numbers := make([]int, 0, len(questions))
		for _, question := range questions {
			numbers = append(numbers, question.Number)
		}
		if err := parser.ValidatePageQuestionRange(page, numbers); err != nil {
			return err
		}
		checkpoint := pool.Page{Page: page, Questions: questions}
		if err := SavePage(cfg.PageDir, checkpoint); err != nil {
			return err
		}
		logf(cfg, "saved page %d with %d questions", page, len(questions))
		pages = replacePage(pages, checkpoint)
		if err := writeMerged(cfg, pages); err != nil {
			return err
		}
		logf(cfg, "merged %d pages", len(pages))
	}
	return nil
}

func SavePage(dir string, page pool.Page) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create page dir: %w", err)
	}
	body, err := json.MarshalIndent(page, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal page %d: %w", page.Page, err)
	}
	body = append(body, '\n')
	path := filepath.Join(dir, fmt.Sprintf("p%03d.json", page.Page))
	if err := os.WriteFile(path, body, 0o644); err != nil {
		return fmt.Errorf("write page %d: %w", page.Page, err)
	}
	return nil
}

func LoadPages(dir string) ([]pool.Page, error) {
	matches, err := filepath.Glob(filepath.Join(dir, "p*.json"))
	if err != nil {
		return nil, fmt.Errorf("glob pages: %w", err)
	}
	pages := make([]pool.Page, 0, len(matches))
	for _, path := range matches {
		body, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read page %s: %w", path, err)
		}
		var page pool.Page
		if err := json.Unmarshal(body, &page); err != nil {
			return nil, fmt.Errorf("decode page %s: %w", path, err)
		}
		pages = append(pages, page)
	}
	sort.Slice(pages, func(i, j int) bool {
		return pages[i].Page < pages[j].Page
	})
	return pages, nil
}

func NextPage(pages []pool.Page, pageStart int) int {
	next := pageStart
	for _, page := range pages {
		if page.Page >= next {
			next = page.Page + 1
		}
	}
	return next
}

func replacePage(pages []pool.Page, page pool.Page) []pool.Page {
	for i := range pages {
		if pages[i].Page == page.Page {
			pages[i] = page
			return pages
		}
	}
	return append(pages, page)
}

func writeMerged(cfg Config, pages []pool.Page) error {
	exam, err := pool.MergePages(cfg.ExamSlug, cfg.DisplayName, cfg.Version, cfg.Now().UTC().Format(time.RFC3339), pages)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(cfg.Output), 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}
	return pool.WriteExam(cfg.Output, exam)
}

func logf(cfg Config, format string, args ...any) {
	if cfg.Logf != nil {
		cfg.Logf(format, args...)
	}
}
