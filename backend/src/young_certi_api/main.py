from __future__ import annotations

import asyncio
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

import boto3
import yaml
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from young_certi_api.errors import (
    ApiError,
    RequestIdMiddleware,
    api_error_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from young_certi_api.pool import QuestionPool, S3QuestionSource
from young_certi_api.routers.questions import router


REFRESH_INTERVAL_SECONDS = 300


def build_s3_pool() -> QuestionPool:
    client = boto3.client(
        "s3",
        endpoint_url=os.getenv("S3_ENDPOINT_URL"),
        region_name=os.getenv("AWS_REGION", "ap-northeast-2"),
    )
    return QuestionPool(
        S3QuestionSource(
            client,
            bucket=os.environ["S3_BUCKET"],
            key=os.environ["S3_QUESTIONS_KEY"],
        )
    )


async def refresh_loop(pool: QuestionPool, interval_seconds: int) -> None:
    while True:
        await asyncio.sleep(interval_seconds)
        await asyncio.to_thread(pool.refresh_once)


def load_contract_openapi() -> dict[str, object]:
    contract = "/workspace/specs/001-question-practice/contracts/openapi.yaml"
    with open(contract) as file:
        data = yaml.safe_load(file)
    if not isinstance(data, dict):
        raise RuntimeError("OpenAPI contract must be a mapping")
    return data


def create_app(pool: QuestionPool | None = None, load_on_startup: bool = True) -> FastAPI:
    selected_pool = pool or build_s3_pool()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.pool = selected_pool
        task: asyncio.Task[None] | None = None
        if load_on_startup:
            await asyncio.to_thread(selected_pool.load_initial)
            task = asyncio.create_task(refresh_loop(selected_pool, REFRESH_INTERVAL_SECONDS))
        try:
            yield
        finally:
            if task is not None:
                task.cancel()

    app = FastAPI(
        title="YoungCerti Question API",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.pool = selected_pool
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            origin.strip()
            for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
            if origin.strip()
        ],
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(router)
    app.add_exception_handler(ApiError, cast(Any, api_error_handler))
    app.add_exception_handler(RequestValidationError, cast(Any, validation_error_handler))
    app.add_exception_handler(Exception, unhandled_error_handler)
    app.openapi = load_contract_openapi  # type: ignore[method-assign] 
    return app


app = create_app()
