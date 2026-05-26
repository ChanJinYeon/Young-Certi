package run

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"young-certi/crawler/internal/pool"
)

func TestSavePageAndLoadPagesResumeFromNextPage(t *testing.T) {
	dir := t.TempDir()
	page := pool.Page{
		Page: 2,
		Questions: []pool.Question{{
			ExamSlug:  "sap-c02",
			Number:    1,
			Text:      "one",
			Choices:   []pool.Choice{{Label: "A", Text: "a"}},
			AnswerKey: []string{"A"},
		}},
	}

	if err := SavePage(dir, page); err != nil {
		t.Fatalf("SavePage returned error: %v", err)
	}
	pages, err := LoadPages(dir)
	if err != nil {
		t.Fatalf("LoadPages returned error: %v", err)
	}
	if len(pages) != 1 || pages[0].Page != 2 {
		t.Fatalf("pages = %+v, want page 2", pages)
	}
	if got := NextPage(pages, 2); got != 3 {
		t.Fatalf("NextPage = %d, want 3", got)
	}
}

func TestCrawlUsesSavedPagesAndWritesMergedOutput(t *testing.T) {
	dir := t.TempDir()
	fixture, err := os.ReadFile("../../testdata/krdump-page.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}
	output := filepath.Join(dir, "questions.json")

	err = Crawl(context.Background(), Config{
		ExamSlug:    "sap-c02",
		DisplayName: "AWS SAP-C02",
		Version:     "v2025-11-26.q476",
		PageStart:   2,
		PageEnd:     2,
		PageDir:     filepath.Join(dir, "pages"),
		Output:      output,
		Fetch: func(context.Context, int, string) ([]byte, error) {
			return fixture, nil
		},
	})
	if err != nil {
		t.Fatalf("Crawl returned error: %v", err)
	}

	body, err := os.ReadFile(output)
	if err != nil {
		t.Fatalf("read output: %v", err)
	}
	var exam pool.Exam
	if err := json.Unmarshal(body, &exam); err != nil {
		t.Fatalf("unmarshal output: %v", err)
	}
	if len(exam.Questions) != 4 {
		t.Fatalf("questions len = %d, want 4", len(exam.Questions))
	}
	if _, err := os.Stat(filepath.Join(dir, "pages", "p002.json")); err != nil {
		t.Fatalf("stat checkpoint: %v", err)
	}
}
