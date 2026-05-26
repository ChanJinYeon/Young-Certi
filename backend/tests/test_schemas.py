import pytest
from pydantic import ValidationError

from young_certi_api.schemas import Exam, Question


def test_exam_accepts_fixture_shape() -> None:
    exam = Exam.model_validate(
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
                    "explanation": None,
                }
            ],
        }
    )

    assert exam.slug == "sap-c02"
    assert exam.questions[0].choices[0].label == "A"


def test_question_rejects_answer_not_in_choices() -> None:
    with pytest.raises(ValidationError):
        Question.model_validate(
            {
                "examSlug": "sap-c02",
                "number": 1,
                "text": "Question?",
                "choices": [{"label": "A", "text": "Amazon S3"}],
                "answerKey": ["B"],
                "explanation": None,
            }
        )


def test_exam_rejects_duplicate_question_numbers() -> None:
    payload = {
        "slug": "sap-c02",
        "displayName": "AWS SAP-C02",
        "version": "fixture",
        "questions": [
            {
                "examSlug": "sap-c02",
                "number": 1,
                "text": "Question 1?",
                "choices": [{"label": "A", "text": "Amazon S3"}],
                "answerKey": ["A"],
            },
            {
                "examSlug": "sap-c02",
                "number": 1,
                "text": "Question 1 again?",
                "choices": [{"label": "A", "text": "Amazon S3"}],
                "answerKey": ["A"],
            },
        ],
    }

    with pytest.raises(ValidationError):
        Exam.model_validate(payload)

