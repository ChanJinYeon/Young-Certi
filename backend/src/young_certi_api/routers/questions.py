from fastapi import APIRouter, Path, Request

from young_certi_api.errors import ApiError
from young_certi_api.pool import PoolLoadError, QuestionNotFoundError, QuestionPool
from young_certi_api.schemas import ExamSummary, Health, Question, QuestionNumbers

router = APIRouter()


def get_pool(request: Request) -> QuestionPool:
    pool = getattr(request.app.state, "pool", None)
    if not isinstance(pool, QuestionPool):
        raise ApiError(503, "POOL_UNAVAILABLE", "문제 풀이 데이터를 아직 사용할 수 없습니다.")
    return pool


@router.get(
    "/healthz",
    response_model=Health,
    response_model_exclude_none=True,
    operation_id="getHealthz",
)
def healthz() -> Health:
    return Health(status="ok")


@router.get(
    "/readyz",
    response_model=Health,
    response_model_exclude_none=True,
    operation_id="getReadyz",
)
def readyz(request: Request) -> Health:
    try:
        version, loaded_at = get_pool(request).health()
    except PoolLoadError as exc:
        raise ApiError(503, "POOL_UNAVAILABLE", "문제 풀이 데이터를 아직 사용할 수 없습니다.") from exc
    return Health(status="ok", poolVersion=version, loadedAt=loaded_at.isoformat())


@router.get("/exams", response_model=list[ExamSummary], operation_id="listExams")
def list_exams(request: Request) -> list[ExamSummary]:
    return [get_pool(request).exam_summary()]


@router.get(
    "/exams/{examSlug}/questions",
    response_model=QuestionNumbers,
    operation_id="listQuestionNumbers",
)
def list_question_numbers(
    request: Request, examSlug: str = Path(pattern=r"^[a-z0-9][a-z0-9-]*$")
) -> QuestionNumbers:
    try:
        return get_pool(request).question_numbers(examSlug)
    except QuestionNotFoundError as exc:
        raise ApiError(
            404,
            "NOT_FOUND",
            "해당 시험을 찾을 수 없습니다.",
            {"examSlug": examSlug},
        ) from exc


@router.get(
    "/exams/{examSlug}/questions/{number}",
    response_model=Question,
    operation_id="getQuestion",
)
def get_question(
    request: Request,
    examSlug: str = Path(pattern=r"^[a-z0-9][a-z0-9-]*$"),
    number: int = Path(ge=1),
) -> Question:
    try:
        return get_pool(request).get_question(examSlug, number)
    except QuestionNotFoundError as exc:
        raise ApiError(
            404,
            "NOT_FOUND",
            "해당 문제를 찾을 수 없습니다.",
            {"examSlug": examSlug, "number": number},
        ) from exc
