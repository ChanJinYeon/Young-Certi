import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExamResult } from "../src/components/ExamResult";
import type { Question } from "../src/api/types";
import type { ExamAttempt } from "../src/hooks/useExamAttempt";

const questions: Question[] = [
  {
    examSlug: "sap-c02",
    number: 1,
    text: "Which service stores objects?",
    choices: [
      { label: "A", text: "Amazon S3" },
      { label: "B", text: "Amazon RDS" },
    ],
    answerKey: ["A"],
    explanation: "S3 stores objects.",
  },
  {
    examSlug: "sap-c02",
    number: 2,
    text: "Choose compute services.",
    choices: [
      { label: "A", text: "Amazon EC2" },
      { label: "B", text: "Amazon SQS" },
      { label: "C", text: "AWS Lambda" },
    ],
    answerKey: ["A", "C"],
    explanation: "EC2 and Lambda run compute workloads.",
  },
];

const attempt: ExamAttempt = {
  examSlug: "sap-c02",
  questionNumbers: [1, 2],
  answers: {
    1: ["A"],
    2: ["A"],
  },
  startedAt: "2026-05-27T00:00:00.000Z",
  durationMinutes: 180,
  status: "submitted",
  submittedAt: "2026-05-27T01:00:00.000Z",
  score: {
    correct: 1,
    total: 2,
    percent: 50,
    pass: false,
  },
};

describe("ExamResult", () => {
  it("renders score, fail badge, and every question review", () => {
    render(<ExamResult attempt={attempt} questions={questions} />);

    expect(screen.getByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("불합격")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByText("내 답: A. Amazon S3")).toBeInTheDocument();
    expect(screen.getByText("정답: A. Amazon S3")).toBeInTheDocument();
    expect(screen.getByText("S3 stores objects.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제 2" })).toBeInTheDocument();
    expect(screen.getByText("내 답: A. Amazon EC2")).toBeInTheDocument();
    expect(screen.getByText("정답: A. Amazon EC2, C. AWS Lambda")).toBeInTheDocument();
    expect(screen.getByText("EC2 and Lambda run compute workloads.")).toBeInTheDocument();
  });

  it("renders pass badge when the score reaches 75 percent", () => {
    render(
      <ExamResult
        attempt={{
          ...attempt,
          score: { correct: 2, total: 2, percent: 100, pass: true },
        }}
        questions={questions}
      />,
    );

    expect(screen.getByText("합격")).toBeInTheDocument();
  });
});
