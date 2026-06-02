import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExamLandingPage } from "../src/pages/ExamLandingPage";
import { ExamPage } from "../src/pages/ExamPage";

function renderExam(path = "/sap-c02/exam", initialEntries = [path]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
        <Routes>
          <Route path="/:examSlug/exam" element={<ExamPage />} />
          <Route path="/:examSlug/" element={<ExamLandingPage />} />
          <Route path="/:examSlug/practice" element={<h1>문제 풀이</h1>} />
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>YoungCerti</h1>} />
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

function stubExamFetchWithPoolNumbers() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/exams/sap-c02/questions")) {
        return Response.json({ examSlug: "sap-c02", version: "fixture", total: 2, numbers: [10, 20] });
      }
      if (url.endsWith("/exams/sap-c02/questions/10")) {
        return Response.json({
          examSlug: "sap-c02",
          number: 10,
          text: "Pool question 10?",
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
        number: 20,
        text: "Pool question 20?",
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

    const view = renderExam("/sap-c02/exam", ["/previous", "/sap-c02/exam"]);

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "시험 시작" }));

    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByText("Exam question 1?")).toBeInTheDocument();
    const topBar = screen.getByTestId("study-two-pane-top-bar");
    expect(topBar.firstElementChild).toHaveClass("grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]");
    const pager = within(topBar).getByRole("group", { name: "문제 이동" });
    expect(within(topBar).getByText("남은 시간")).toBeInTheDocument();
    expect(screen.getByTestId("exam-study-content")).toHaveClass("xl:-translate-x-[7.5rem]");
    expect(within(topBar).getByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    expect(within(topBar).queryByRole("heading", { name: "문제 1" })).not.toBeInTheDocument();
    const bottomControls = screen.getByRole("group", { name: "시험 하단 컨트롤" });
    const positionList = screen.getByRole("navigation", { name: "시험 위치 목록" });
    expect(within(topBar).getByRole("button", { name: "이전 화면으로" })).toHaveTextContent("이전");
    expect(within(pager).getByRole("button", { name: "이전" })).toBeDisabled();
    expect(within(pager).getByText("1 / 2")).toBeInTheDocument();
    expect(within(pager).getByRole("button", { name: "다음" })).toBeEnabled();
    expect(within(bottomControls).getByRole("button", { name: "시험 제출" })).toBeInTheDocument();
    expect(within(positionList).getByRole("link", { name: "시험 위치 1 현재 미응답" })).toBeInTheDocument();
    expect(within(positionList).getByRole("link", { name: "시험 위치 2 미응답" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("A. Amazon S3"));
    expect(within(positionList).getByRole("link", { name: "시험 위치 1 현재 응답됨" })).toBeInTheDocument();
    expect(screen.queryByText("정답 선택")).not.toBeInTheDocument();
    expect(screen.queryByText("S3입니다.")).not.toBeInTheDocument();

    await user.click(within(pager).getByRole("button", { name: "다음" }));
    expect(await screen.findByRole("heading", { name: "문제 2" })).toBeInTheDocument();
    await user.click(within(positionList).getByRole("link", { name: "시험 위치 1 응답됨" }));
    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("A. Amazon S3")).toBeChecked();

    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));
    expect(screen.getByRole("dialog", { name: "시험 나가기 확인" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog", { name: "시험 나가기 확인" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));
    await user.click(screen.getByRole("button", { name: "초기화하고 이전으로" }));
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeInTheDocument();
    const sessionId = localStorage.getItem("young-certi/sessionId");
    expect(localStorage.getItem(`young-certi/v1/${sessionId}/exam/sap-c02`)).toBeNull();

    view.unmount();
    renderExam();
    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
  });

  it("shows exam position in the heading and resumes on reload without reset", async () => {
    stubExamFetchWithPoolNumbers();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [10, 20],
        answers: {},
        startedAt: new Date().toISOString(),
        durationMinutes: 180,
        status: "in-progress",
        submittedAt: null,
        score: null,
      }),
    );
    const view = renderExam();

    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(await screen.findByText("Pool question 10?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "시험 위치 2 미응답" }));
    expect(await screen.findByRole("heading", { name: "문제 2" })).toBeInTheDocument();
    expect(await screen.findByText("Pool question 20?")).toBeInTheDocument();

    view.unmount();
    renderExam();
    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    expect(await screen.findByText("Pool question 10?")).toBeInTheDocument();
  });

  it("submits by confirmation from the bottom-right control", async () => {
    const user = userEvent.setup();
    stubExamFetch();

    renderExam();

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "시험 시작" }));
    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();
    await user.click(screen.getByLabelText("A. Amazon S3"));

    await user.click(
      within(screen.getByRole("group", { name: "시험 하단 컨트롤" })).getByRole("button", {
        name: "시험 제출",
      }),
    );
    expect(screen.getByRole("dialog", { name: "시험 제출 확인" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제출하기" }));

    expect(await screen.findByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("불합격").length).toBeGreaterThan(0);
    expect(screen.getByTestId("exam-result-study-content")).toHaveClass("xl:-translate-x-[7.5rem]");
    expect(screen.getByTestId("study-two-pane-top-bar").firstElementChild).toHaveClass(
      "grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]",
    );
    const resultControls = screen.getByRole("group", { name: "시험 결과 상단 컨트롤" });
    expect(within(resultControls).getByText("1 / 2")).toBeInTheDocument();
    expect(within(resultControls).getByRole("button", { name: "이전" })).toBeDisabled();
    expect(within(resultControls).getByRole("button", { name: "다음" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toHaveTextContent("이전");
    expect(screen.getByRole("button", { name: "다시 풀기" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "틀린 문제 문제집에 추가" })).not.toBeInTheDocument();
    const resultList = screen.getByRole("navigation", { name: "시험 결과 문제 목록" });
    expect(within(resultList).getByRole("link", { name: "시험 결과 문제 1 현재 정답" })).toHaveAttribute("href", "#q-1");
    expect(within(resultList).getByRole("link", { name: "시험 결과 문제 2 오답" })).toHaveAttribute("href", "#q-2");
    const resultArticle = await screen.findByRole("article", { name: "문제 1 정답" });
    expect(resultArticle).toBeInTheDocument();
    const resultBottomControls = screen.getByRole("group", { name: "시험 결과 하단 컨트롤" });
    const addToSetButton = within(resultBottomControls).getByRole("button", { name: "문제집에 추가" });
    expect(resultArticle).not.toContainElement(addToSetButton);
    expect(screen.queryByRole("article", { name: "문제 2 오답" })).not.toBeInTheDocument();

    await user.click(within(resultControls).getByRole("button", { name: "다음" }));
    expect(await screen.findByRole("article", { name: "문제 2 오답" })).toBeInTheDocument();
    expect(screen.queryByRole("article", { name: "문제 1 정답" })).not.toBeInTheDocument();
    expect(within(resultControls).getByText("2 / 2")).toBeInTheDocument();
    expect(within(resultControls).getByRole("button", { name: "다음" })).toBeDisabled();

    await user.click(within(resultList).getByRole("link", { name: "시험 결과 문제 1 정답" }));
    expect(await screen.findByRole("article", { name: "문제 1 정답" })).toBeInTheDocument();
    expect(within(resultControls).getByText("1 / 2")).toBeInTheDocument();
  });

  it("confirms before resetting the submitted exam from the result top bar", async () => {
    const user = userEvent.setup();
    stubExamFetch();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [1, 2],
        answers: { 1: ["A"], 2: ["A"] },
        startedAt: "2026-05-27T00:00:00.000Z",
        durationMinutes: 180,
        status: "submitted",
        submittedAt: "2026-05-27T01:00:00.000Z",
        score: { correct: 1, total: 2, percent: 50, pass: false },
      }),
    );

    renderExam();

    expect(await screen.findByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "다시 풀기" }));

    expect(screen.getByRole("dialog", { name: "시험 다시 풀기 확인" })).toBeInTheDocument();
    expect(screen.getByText("현재 시험 결과와 답안 기록이 삭제됩니다.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    expect(localStorage.getItem("young-certi/v1/session-1/exam/sap-c02")).toContain('"status":"submitted"');

    await user.click(screen.getByRole("button", { name: "다시 풀기" }));
    await user.click(screen.getByRole("button", { name: "다시 풀기 시작" }));

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    expect(screen.getByLabelText("+30분 추가 시간 사용")).toBeInTheDocument();
    expect(localStorage.getItem("young-certi/v1/session-1/exam/sap-c02")).toBeNull();
  });

  it("navigates from the result screen to the previous page without resetting the submitted exam", async () => {
    const user = userEvent.setup();
    stubExamFetch();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [1, 2],
        answers: { 1: ["A"], 2: ["A"] },
        startedAt: "2026-05-27T00:00:00.000Z",
        durationMinutes: 180,
        status: "submitted",
        submittedAt: "2026-05-27T01:00:00.000Z",
        score: { correct: 1, total: 2, percent: 50, pass: false },
      }),
    );

    renderExam("/sap-c02/exam", ["/previous", "/sap-c02/exam"]);

    expect(await screen.findByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    expect(await screen.findByRole("article", { name: "문제 1 정답" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));

    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeInTheDocument();
    expect(localStorage.getItem("young-certi/v1/session-1/exam/sap-c02")).toContain('"status":"submitted"');
  });

  it("uses sequential result labels but stores real question refs for individual sets", async () => {
    const user = userEvent.setup();
    stubExamFetchWithPoolNumbers();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [10, 20],
        answers: { 10: ["A"] },
        startedAt: "2026-05-27T00:00:00.000Z",
        durationMinutes: 180,
        status: "submitted",
        submittedAt: "2026-05-27T01:00:00.000Z",
        score: { correct: 1, total: 2, percent: 50, pass: false },
      }),
    );

    renderExam();

    expect(await screen.findByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    const resultList = screen.getByRole("navigation", { name: "시험 결과 문제 목록" });
    expect(await within(resultList).findByRole("link", { name: "시험 결과 문제 1 현재 정답" })).toHaveAttribute("href", "#q-1");
    expect(await within(resultList).findByRole("link", { name: "시험 결과 문제 2 오답" })).toHaveAttribute("href", "#q-2");
    expect(await screen.findByRole("article", { name: "문제 1 정답" })).toHaveAttribute("id", "q-1");
    expect(screen.queryByRole("article", { name: "문제 10 정답" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "문제집에 추가" }));
    await user.type(screen.getByLabelText("문제집 이름"), "Single");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(await screen.findByRole("status")).toHaveTextContent("문제집에 추가했습니다.");

    expect(screen.queryByRole("button", { name: "틀린 문제 문제집에 추가" })).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]");
    expect(stored.find((set: { name: string }) => set.name === "Single").questionRefs).toEqual([
      { examSlug: "sap-c02", number: 10 },
    ]);
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

    expect(await screen.findByRole("heading", { name: "시험 결과" })).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByRole("group", { name: "시험 결과 상단 컨트롤" })).toBeInTheDocument();
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
