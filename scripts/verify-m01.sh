#!/bin/sh
set -eu

required_paths="
docker-compose.yml
.dockerignore
.env.example
Makefile
README.md
backend/Dockerfile
frontend/Dockerfile
crawler/Dockerfile
infra/Dockerfile
crawler/testdata/fixture-questions.json
"

for path in $required_paths; do
  if [ ! -e "$path" ]; then
    echo "missing required path: $path" >&2
    exit 1
  fi
done

docker compose config >/dev/null
