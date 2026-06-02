import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExamResult } from "../src/components/ExamResult";
import type { Question } from "../src/api/types";
import type { Correctness } from "../src/hooks/usePerQuestionResult";

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

describe("ExamResult", () => {
  it("renders one correct question review without score chrome", () => {
    render(<ExamResult question={questions[0]} selected={["A"]} correctness={"correct" satisfies Correctness} />);

    expect(screen.queryByRole("heading", { name: "시험 결과" })).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 2")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "문제 1 정답" })).toHaveAttribute("id", "q-1");
    expect(screen.getByText("내 답: A. Amazon S3")).toBeInTheDocument();
    expect(screen.getByText("정답: A. Amazon S3")).toBeInTheDocument();
    expect(screen.getByText("S3 stores objects.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "문제 2" })).not.toBeInTheDocument();
  });

  it("renders one incorrect multi-choice review", () => {
    render(<ExamResult question={questions[1]} selected={["A"]} correctness={"incorrect" satisfies Correctness} />);

    expect(screen.getByRole("article", { name: "문제 2 오답" })).toHaveAttribute("id", "q-2");
    expect(screen.getByText("내 답: A. Amazon EC2")).toBeInTheDocument();
    expect(screen.getByText("정답: A. Amazon EC2, C. AWS Lambda")).toBeInTheDocument();
    expect(screen.getByText("EC2 and Lambda run compute workloads.")).toBeInTheDocument();
  });

  it("renders unanswered selected labels", () => {
    render(<ExamResult question={questions[1]} selected={[]} correctness={"incorrect" satisfies Correctness} />);

    expect(screen.getByText("내 답: 미응답")).toBeInTheDocument();
  });

  it("can display sequential result numbers while keeping the real question content", () => {
    render(
      <ExamResult
        question={{ ...questions[1], number: 20 }}
        displayNumber={2}
        selected={[]}
        correctness={"incorrect" satisfies Correctness}
        actions={<button type="button">문제집에 추가</button>}
      />,
    );

    expect(screen.getByRole("article", { name: "문제 2 오답" })).toHaveAttribute("id", "q-2");
    expect(screen.getByRole("heading", { name: "문제 2" })).toBeInTheDocument();
    expect(screen.getByText("Choose compute services.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "문제 20" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문제집에 추가" })).toBeInTheDocument();
  });
});
