# YoungCerti

Container-first question practice MVP for AWS SAP-C02.

## Local Development

Copy `.env.example` to `.env` if you need to override defaults, then run:

```sh
make dev
```

The local stack starts MinIO, a placeholder FastAPI container, a placeholder Vite container, the Go crawler container, and a Terraform utility container. MinIO is seeded with `crawler/testdata/fixture-questions.json` at `young-certi-data/sap-c02/questions.json`.

All project commands are wrapped by Docker Compose. Do not install Python, Node, Go, or Terraform on the host for this project.
