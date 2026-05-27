import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExamLandingPage } from "../src/pages/ExamLandingPage";
import { ExamPage } from "../src/pages/ExamPage";

function renderExam(path = "/sap-c02/exam") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:examSlug/exam" element={<ExamPage />} />
          <Route path="/:examSlug/" element={<ExamLandingPage />} />
          <Route path="/:examSlug/practice" element={<h1>문제 풀이</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubExamFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/exams/sap-c02/questions")) {
        return Response.json({ examSlug: "sap-c02", version: "fixture", total: 2, numbers: [1, 2] });
      }
      if (url.endsWith("/exams/sap-c02/questions/1")) {
        return Response.json({
          examSlug: "sap-c02",
          number: 1,
          text: "Exam question 1?",
          choices: [
            { label: "A", text: "Amazon S3" },
            { label: "B", text: "Amazon RDS" },
          ],
          answerKey: ["A"],
          explanation: "S3입니다.",
        });
      }
      return Response.json({
        examSlug: "sap-c02",
        number: 2,
        text: "Exam question 2?",
        choices: [
          { label: "A", text: "Amazon EKS" },
          { label: "B", text: "Amazon EC2" },
        ],
        answerKey: ["B"],
        explanation: "EC2입니다.",
      });
    }),
  );
}

describe("ExamPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("starts an exam, records answers, navigates without showing feedback, and submits by confirmation", async () => {
    const user = userEvent.setup();
    stubExamFetch();

    renderExam();

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "시험 시작" }));

    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByText("Exam question 1?")).toBeInTheDocument();
    expect(screen.getByText("남은 시간")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "문제 1 현재" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("A. Amazon S3"));
    expect(screen.queryByText("정답 선택")).not.toBeInTheDocument();
    expect(screen.queryByText("S3입니다.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByRole("heading", { name: "문제 2" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "문제 1 응답됨" }));
    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("A. Amazon S3")).toBeChecked();

    await user.click(screen.getByRole("button", { name: "시험 제출" }));
    expect(screen.getByRole("dialog", { name: "시험 제출 확인" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(await screen.findByRole("heading", { name: "시험 제출 완료" })).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("auto-submits immediately when a resumed attempt is expired", async () => {
    stubExamFetch();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [1, 2],
        answers: { 1: ["A"] },
        startedAt: "2000-01-01T00:00:00.000Z",
        durationMinutes: 1,
        status: "in-progress",
        submittedAt: null,
        score: null,
      }),
    );
    renderExam();

    expect(await screen.findByRole("heading", { name: "시험 제출 완료" })).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("activates the landing exam entry", async () => {
    const user = userEvent.setup();
    stubExamFetch();

    renderExam("/sap-c02/");

    expect(await screen.findByRole("link", { name: /시험 모드/ })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /시험 모드/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "시험 모드" })).toBeInTheDocument());
  });
});
