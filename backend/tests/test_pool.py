import json
from typing import Any

import pytest

from young_certi_api.pool import PoolLoadError, QuestionPool, S3QuestionSource


class Body:
    def __init__(self, value: bytes) -> None:
        self.value = value

    def read(self) -> bytes:
        return self.value


class FakeS3:
    def __init__(self, body: dict[str, Any], etag: str = '"v1"', fail_head: bool = False) -> None:
        self.body = body
        self.etag = etag
        self.fail_head = fail_head
        self.get_calls = 0

    def head_object(self, **_: str) -> dict[str, str]:
        if self.fail_head:
            raise RuntimeError("s3 unavailable")
        return {"ETag": self.etag}

    def get_object(self, **_: str) -> dict[str, Body]:
        self.get_calls += 1
        return {"Body": Body(json.dumps(self.body).encode())}


def exam_payload(version: str = "v1", answer: str = "A") -> dict[str, Any]:
    return {
        "slug": "sap-c02",
        "displayName": "AWS SAP-C02",
        "version": version,
        "questions": [
            {
                "examSlug": "sap-c02",
                "number": 1,
                "text": "Question?",
                "choices": [{"label": "A", "text": "Amazon S3"}],
                "answerKey": [answer],
                "explanation": "Because MinIO is S3-compatible.",
            }
        ],
    }


def test_boot_load_downloads_and_validates_pool() -> None:
    source = S3QuestionSource(FakeS3(exam_payload()), bucket="bucket", key="sap-c02/questions.json")
    pool = QuestionPool(source)

    pool.load_initial()

    assert pool.ready
    assert pool.exam_summary().totalQuestions == 1
    assert pool.get_question("sap-c02", 1).answerKey == ["A"]


def test_refresh_noop_when_etag_unchanged() -> None:
    fake = FakeS3(exam_payload(), etag='"same"')
    pool = QuestionPool(S3QuestionSource(fake, bucket="bucket", key="key"))
    pool.load_initial()

    pool.refresh_once()

    assert fake.get_calls == 1


def test_refresh_swaps_when_etag_changes_and_payload_valid() -> None:
    fake = FakeS3(exam_payload("v1"), etag='"v1"')
    pool = QuestionPool(S3QuestionSource(fake, bucket="bucket", key="key"))
    pool.load_initial()

    fake.body = exam_payload("v2")
    fake.etag = '"v2"'
    pool.refresh_once()

    assert pool.exam_summary().version == "v2"


@pytest.mark.parametrize(
    "body",
    [
        exam_payload("v2", answer="B"),
        {"slug": "sap-c02", "displayName": "AWS SAP-C02", "version": "bad", "questions": []},
    ],
)
def test_refresh_keeps_old_pool_when_changed_payload_invalid(
    body: dict[str, Any],
) -> None:
    fake = FakeS3(exam_payload("v1"), etag='"v1"')
    pool = QuestionPool(S3QuestionSource(fake, bucket="bucket", key="key"))
    pool.load_initial()

    fake.body = body
    fake.etag = '"v2"'

    pool.refresh_once()

    assert pool.exam_summary().version == "v1"


def test_refresh_keeps_old_pool_when_s3_head_fails() -> None:
    fake = FakeS3(exam_payload("v1"), etag='"v1"')
    pool = QuestionPool(S3QuestionSource(fake, bucket="bucket", key="key"))
    pool.load_initial()

    fake.fail_head = True
    pool.refresh_once()

    assert pool.exam_summary().version == "v1"


def test_boot_failure_raises_when_initial_pool_cannot_load() -> None:
    fake = FakeS3(exam_payload("v1"), fail_head=True)
    pool = QuestionPool(S3QuestionSource(fake, bucket="bucket", key="key"))

    with pytest.raises(PoolLoadError):
        pool.load_initial()
