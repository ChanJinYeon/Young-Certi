from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class Choice(BaseModel):
    label: str = Field(min_length=1)
    text: str


class Question(BaseModel):
    examSlug: str
    number: int = Field(ge=1)
    text: str
    choices: list[Choice] = Field(min_length=1, max_length=8)
    answerKey: list[str] = Field(min_length=1)
    explanation: str | None = None

    @model_validator(mode="after")
    def validate_choice_labels_and_answers(self) -> "Question":
        labels = [choice.label for choice in self.choices]
        if len(labels) != len(set(labels)):
            raise ValueError("choice labels must be unique within a question")
        unknown_answers = set(self.answerKey) - set(labels)
        if unknown_answers:
            raise ValueError("answerKey must be a subset of choices[].label")
        return self


class Exam(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]*$")
    displayName: str
    version: str
    crawledAt: str | None = None
    questions: list[Question] = Field(min_length=1)

    @field_validator("questions")
    @classmethod
    def validate_unique_question_numbers(cls, questions: list[Question]) -> list[Question]:
        numbers = [question.number for question in questions]
        if len(numbers) != len(set(numbers)):
            raise ValueError("question numbers must be unique within an exam")
        return questions


class ExamSummary(BaseModel):
    slug: str
    displayName: str
    version: str
    totalQuestions: int


class QuestionNumbers(BaseModel):
    examSlug: str
    version: str
    total: int
    numbers: list[int]


class Health(BaseModel):
    status: Literal["ok"]
    poolVersion: str | None = None
    loadedAt: str | None = None


class ErrorEnvelope(BaseModel):
    code: Literal["NOT_FOUND", "VALIDATION", "POOL_UNAVAILABLE", "INTERNAL"]
    message: str
    details: dict[str, object] | None = None
    requestId: str
