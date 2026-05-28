# Node.js가 설치된 가벼운 Debian 기반 이미지
FROM node:22-slim

ENV PNPM_HOME=/pnpm \
PATH=/pnpm:$PATH

WORKDIR /workspace/frontend

RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY frontend ./

EXPOSE 5173

CMD ["pnpm", "dev"]