from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

from pydantic import ValidationError

from young_certi_api.schemas import Exam, ExamSummary, Question, QuestionNumbers


class PoolLoadError(RuntimeError):
    pass


class QuestionNotFoundError(KeyError):
    pass


class S3Client(Protocol):
    def head_object(self, **kwargs: str) -> dict[str, Any]: ...

    def get_object(self, **kwargs: str) -> dict[str, Any]: ...


class QuestionSource(Protocol):
    def head_etag(self) -> str: ...

    def read_exam(self) -> tuple[dict[str, Any], str]: ...


class S3QuestionSource:
    def __init__(self, client: S3Client, bucket: str, key: str) -> None:
        self.client = client
        self.bucket = bucket
        self.key = key

    def head_etag(self) -> str:
        response = self.client.head_object(Bucket=self.bucket, Key=self.key)
        return str(response["ETag"])

    def read_exam(self) -> tuple[dict[str, Any], str]:
        response = self.client.get_object(Bucket=self.bucket, Key=self.key)
        body = response["Body"].read()
        return json.loads(body), self.head_etag()


class StaticQuestionSource:
    def __init__(self, payload: dict[str, Any], etag: str = '"static"') -> None:
        self.payload = payload
        self.etag = etag

    def head_etag(self) -> str:
        return self.etag

    def read_exam(self) -> tuple[dict[str, Any], str]:
        return self.payload, self.etag


@dataclass(frozen=True)
class PoolSnapshot:
    exam: Exam
    etag: str
    loaded_at: datetime


class QuestionPool:
    def __init__(self, source: QuestionSource) -> None:
        self._source = source
        self._snapshot: PoolSnapshot | None = None
        self._lock = threading.RLock()

    @property
    def ready(self) -> bool:
        return self._snapshot is not None

    def load_initial(self) -> None:
        try:
            self._source.head_etag()
            payload, etag = self._source.read_exam()
            self._swap(payload, etag)
        except Exception as exc:
            raise PoolLoadError("initial question pool load failed") from exc

    def refresh_once(self) -> None:
        with self._lock:
            current = self._snapshot
        if current is None:
            self.load_initial()
            return

        try:
            etag = self._source.head_etag()
            if etag == current.etag:
                return
            payload, fresh_etag = self._source.read_exam()
            self._swap(payload, fresh_etag)
        except (ValidationError, ValueError, RuntimeError, KeyError, TypeError, json.JSONDecodeError):
            return

    def _swap(self, payload: dict[str, Any], etag: str) -> None:
        exam = Exam.model_validate(payload)
        snapshot = PoolSnapshot(exam=exam, etag=etag, loaded_at=datetime.now(UTC))
        with self._lock:
            self._snapshot = snapshot

    def _require_snapshot(self) -> PoolSnapshot:
        with self._lock:
            snapshot = self._snapshot
        if snapshot is None:
            raise PoolLoadError("question pool is not loaded")
        return snapshot

    def health(self) -> tuple[str, datetime]:
        snapshot = self._require_snapshot()
        return snapshot.exam.version, snapshot.loaded_at

    def exam_summary(self) -> ExamSummary:
        exam = self._require_snapshot().exam
        return ExamSummary(
            slug=exam.slug,
            displayName=exam.displayName,
            version=exam.version,
            totalQuestions=len(exam.questions),
        )

    def question_numbers(self, exam_slug: str) -> QuestionNumbers:
        exam = self._require_exam(exam_slug)
        numbers = [question.number for question in exam.questions]
        return QuestionNumbers(
            examSlug=exam.slug,
            version=exam.version,
            total=len(numbers),
            numbers=numbers,
        )

    def get_question(self, exam_slug: str, number: int) -> Question:
        exam = self._require_exam(exam_slug)
        for question in exam.questions:
            if question.number == number:
                return question
        raise QuestionNotFoundError

    def _require_exam(self, exam_slug: str) -> Exam:
        exam = self._require_snapshot().exam
        if exam.slug != exam_slug:
            raise QuestionNotFoundError
        return exam

