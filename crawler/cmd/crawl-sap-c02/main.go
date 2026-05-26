package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"young-certi/crawler/internal/fetcher"
	"young-certi/crawler/internal/run"
	"young-certi/crawler/internal/uploader"
)

const defaultBaseURL = "https://www.krdump.com/Amazon.SAP-C02.v2025-11-26.q476.html"

func main() {
	if err := realMain(context.Background(), os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func realMain(ctx context.Context, args []string) error {
	var (
		baseURL     string
		pageDir     string
		output      string
		version     string
		fixture     string
		pageStart   int
		pageEnd     int
		maxRetries  int
		interval    time.Duration
		retryDelay  time.Duration
		upload      bool
		initialWait bool
	)
	fs := flag.NewFlagSet("crawl-sap-c02", flag.ContinueOnError)
	fs.StringVar(&baseURL, "base-url", defaultBaseURL, "base krdump URL without page query")
	fs.IntVar(&pageStart, "page-start", 2, "first page to crawl")
	fs.IntVar(&pageEnd, "page-end", 97, "last page to crawl")
	fs.StringVar(&pageDir, "page-dir", "build/pages", "checkpoint page JSON directory")
	fs.StringVar(&output, "output", "build/questions.json", "merged questions JSON path")
	fs.StringVar(&version, "version", "v2025-11-26.q476", "exam version")
	fs.DurationVar(&interval, "interval", 2*time.Minute, "delay between page requests")
	fs.DurationVar(&retryDelay, "retry-delay", 10*time.Minute, "delay before one retry after retryable failure")
	fs.IntVar(&maxRetries, "max-retries", 1, "retry attempts per page")
	fs.BoolVar(&upload, "upload", false, "upload merged output to S3-compatible storage")
	fs.StringVar(&fixture, "fixture", "", "parse this local HTML fixture instead of live HTTP")
	fs.BoolVar(&initialWait, "initial-wait", false, "wait interval before the first live request")
	if err := fs.Parse(args); err != nil {
		return err
	}

	httpClient := fetcher.New(fetcher.ClientConfig{
		Interval:    interval,
		RetryDelay:  retryDelay,
		MaxRetries:  maxRetries,
		UserAgent:   fetcher.DefaultUserAgent,
		Logf:        log.Printf,
		InitialWait: initialWait,
	})
	fetch := func(ctx context.Context, page int, url string) ([]byte, error) {
		if fixture != "" {
			return os.ReadFile(fixture)
		}
		return httpClient.Fetch(ctx, url)
	}
	cfg := run.Config{
		ExamSlug:    "sap-c02",
		DisplayName: "AWS SAP-C02",
		Version:     version,
		BaseURL:     baseURL,
		PageStart:   pageStart,
		PageEnd:     pageEnd,
		PageDir:     pageDir,
		Output:      output,
		Fetch:       fetch,
		Logf:        log.Printf,
	}
	if err := run.Crawl(ctx, cfg); err != nil {
		return err
	}
	if upload {
		return uploadOutput(ctx, output)
	}
	return nil
}

func uploadOutput(ctx context.Context, output string) error {
	body, err := os.ReadFile(output)
	if err != nil {
		return fmt.Errorf("read output for upload: %w", err)
	}
	client, err := uploader.NewS3Client(ctx, uploader.Config{
		EndpointURL: os.Getenv("S3_ENDPOINT_URL"),
		Region:      getenv("AWS_REGION", "ap-northeast-2"),
		AccessKeyID: os.Getenv("AWS_ACCESS_KEY_ID"),
		SecretKey:   os.Getenv("AWS_SECRET_ACCESS_KEY"),
	})
	if err != nil {
		return err
	}
	return uploader.PutObject(ctx, client, getenv("S3_BUCKET", "young-certi-data"), getenv("S3_QUESTIONS_KEY", "sap-c02/questions.json"), body)
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
