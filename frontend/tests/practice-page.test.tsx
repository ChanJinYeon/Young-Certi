import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PracticePage } from "../src/pages/PracticePage";

function renderPractice(path = "/sap-c02/practice", initialEntries = [path]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
        <Routes>
          <Route path="/:examSlug/practice" element={<PracticePage />} />
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>YoungCerti</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubTwoQuestions() {
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
          text: "Question 1?",
          choices: [{ label: "A", text: "Amazon S3" }],
          answerKey: ["A"],
          explanation: "S3입니다.",
        });
      }
      return Response.json({
        examSlug: "sap-c02",
        number: 2,
        text: "Question 2?",
        choices: [{ label: "A", text: "Amazon EKS" }],
        answerKey: ["A"],
        explanation: "EKS입니다.",
      });
    }),
  );
}

describe("PracticePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("fetches a question, rejects empty submit, submits, and navigates next", async () => {
    const user = userEvent.setup();
    stubTwoQuestions();

    renderPractice();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    const topBar = screen.getByTestId("study-two-pane-top-bar");
    expect(topBar.firstElementChild).toHaveClass("grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]");
    const pager = within(topBar).getByRole("group", { name: "문제 이동" });
    const bottomControls = screen.getByRole("group", { name: "문제 하단 컨트롤" });
    expect(within(topBar).getByRole("button", { name: "이전 화면으로" })).toHaveTextContent("이전");
    expect(within(topBar).getByRole("heading", { name: "문제 풀이" })).toBeInTheDocument();
    expect(within(topBar).getByText("AWS SAP-C02")).toHaveClass("hidden", "lg:inline");
    expect(screen.getByTestId("practice-study-content")).toHaveClass("xl:-translate-x-[7.5rem]");
    expect(within(pager).getByRole("button", { name: "이전" })).toBeDisabled();
    expect(within(pager).getByText("1 / 2")).toBeInTheDocument();
    expect(within(pager).getByRole("button", { name: "다음" })).toBeEnabled();
    expect(within(bottomControls).getByRole("button", { name: "문제집에 추가" })).toBeInTheDocument();
    expect(within(bottomControls).getByRole("button", { name: "제출" })).toBeInTheDocument();
    expect(bottomControls).toHaveClass("justify-end");
    expect(bottomControls.textContent).toMatch(/문제집에 추가\s*제출/);

    await user.click(within(bottomControls).getByRole("button", { name: "제출" }));
    expect(screen.getByText("선지를 하나 이상 선택하세요.")).toBeInTheDocument();

    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(within(bottomControls).getByRole("button", { name: "제출" }));
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "문제 하단 컨트롤" })).getByRole("button", { name: "다시 풀기" })).toBeInTheDocument();

    await user.click(within(pager).getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByText("Question 2?")).toBeInTheDocument());
  });

  it("clears only the current question result and allows resubmission", async () => {
    const user = userEvent.setup();
    stubTwoQuestions();

    renderPractice();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 풀기" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByText("Question 2?")).toBeInTheDocument());
    await user.click(screen.getByLabelText("A. Amazon EKS"));
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("EKS입니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "이전" }));
    await waitFor(() => expect(screen.getByText("Question 1?")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "다시 풀기" }));

    expect(screen.queryByText("S3입니다.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 풀기" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("A. Amazon S3")).not.toBeChecked();

    const sessionId = localStorage.getItem("young-certi/sessionId");
    expect(sessionId).toBeTruthy();
    const stored = JSON.parse(localStorage.getItem(`young-certi/v1/${sessionId}/results`) ?? "{}");
    expect(stored["sap-c02:1"]).toBeUndefined();
    expect(stored["sap-c02:2"]).toEqual(expect.objectContaining({ correctness: "correct" }));

    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();
  });

  it("navigates to the previous page without clearing session state", async () => {
    const user = userEvent.setup();
    stubTwoQuestions();

    renderPractice("/sap-c02/practice", ["/previous", "/sap-c02/practice"]);

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "즐겨찾기 추가" }));
    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));

    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeInTheDocument();

    const sessionId = localStorage.getItem("young-certi/sessionId");
    expect(sessionId).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(`young-certi/v1/${sessionId}/favorites`) ?? "[]")).toContain(
      "sap-c02:1",
    );
    expect(JSON.parse(localStorage.getItem(`young-certi/v1/${sessionId}/current`) ?? "{}")).toEqual({});
  });

  it("renders API errors and retry button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "INTERNAL", message: "서버 오류", requestId: "req-1" },
          { status: 500, headers: { "X-Request-Id": "req-1" } },
        ),
      ),
    );

    renderPractice();

    expect(await screen.findByText("서버 오류")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });
});
