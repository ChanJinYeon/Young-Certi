from fastapi.testclient import TestClient

from young_certi_api.main import create_app
from young_certi_api.pool import QuestionPool, StaticQuestionSource


def build_client() -> TestClient:
    source = StaticQuestionSource(
        {
            "slug": "sap-c02",
            "displayName": "AWS SAP-C02",
            "version": "fixture",
            "questions": [
                {
                    "examSlug": "sap-c02",
                    "number": 1,
                    "text": "Question?",
                    "choices": [{"label": "A", "text": "Amazon S3"}],
                    "answerKey": ["A"],
                    "explanation": "Because MinIO is S3-compatible.",
                }
            ],
        },
        etag='"fixture"',
    )
    pool = QuestionPool(source)
    pool.load_initial()
    return TestClient(create_app(pool=pool, load_on_startup=False))


def test_health_and_ready() -> None:
    client = build_client()

    assert client.get("/healthz").json()["status"] == "ok"
    ready = client.get("/readyz")

    assert ready.status_code == 200
    assert ready.json()["poolVersion"] == "fixture"


def test_list_exams_and_questions() -> None:
    client = build_client()

    assert client.get("/exams").json() == [
        {
            "slug": "sap-c02",
            "displayName": "AWS SAP-C02",
            "version": "fixture",
            "totalQuestions": 1,
        }
    ]
    assert client.get("/exams/sap-c02/questions").json()["numbers"] == [1]


def test_get_question() -> None:
    client = build_client()

    response = client.get("/exams/sap-c02/questions/1")

    assert response.status_code == 200
    assert response.json()["answerKey"] == ["A"]


def test_not_found_uses_error_envelope_and_request_id() -> None:
    client = build_client()

    response = client.get("/exams/sap-c02/questions/404", headers={"X-Request-Id": "req-1"})

    assert response.status_code == 404
    assert response.headers["X-Request-Id"] == "req-1"
    assert response.json() == {
        "code": "NOT_FOUND",
        "message": "해당 문제를 찾을 수 없습니다.",
        "details": {"examSlug": "sap-c02", "number": 404},
        "requestId": "req-1",
    }


def test_cors_allow_list() -> None:
    client = build_client()

    response = client.options(
        "/exams",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

