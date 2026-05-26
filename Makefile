.PHONY: dev test test-crawler test-backend test-frontend crawl crawl-fixture cluster-up cluster-down down verify-m01

dev:
	docker compose up -d --build

test: test-crawler test-backend test-frontend

test-crawler:
	docker compose run --rm crawler go test ./...

test-backend:
	docker compose run --rm api python -c "print('backend test stub')"

test-frontend:
	docker compose run --rm web node -e "console.log('frontend test stub')"

crawl:
	docker compose run --rm crawler sh -c "mkdir -p build && go run ./cmd/crawl-sap-c02 -page-start 2 -page-end 97 -interval 2m -retry-delay 10m -max-retries 1 -output build/questions.json -upload"

crawl-fixture:
	docker compose run --rm crawler sh -c "mkdir -p build && go run ./cmd/crawl-sap-c02 -fixture testdata/krdump-page.html -page-start 2 -page-end 2 -output build/questions.json -upload"

cluster-up:
	docker compose run --rm tf sh -c "echo 'cluster-up stub: implemented in later infra tasks'"

cluster-down:
	docker compose run --rm tf sh -c "echo 'cluster-down stub: implemented in later infra tasks'"

down:
	docker compose down -v

verify-m01:
	sh scripts/verify-m01.sh
