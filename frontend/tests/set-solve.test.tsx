import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SetSolvePage } from "../src/pages/SetSolvePage";
import { SetsListPage } from "../src/pages/SetsListPage";

function renderSet(path = "/sap-c02/sets/set-1") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:examSlug/sets" element={<SetsListPage />} />
          <Route path="/:examSlug/sets/:setId" element={<SetSolvePage />} />
          <Route path="/:examSlug/practice" element={<h1>문제 풀이</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function storeSet(questionRefs = [{ examSlug: "sap-c02", number: 1 }, { examSlug: "sap-c02", number: 2 }]) {
  localStorage.setItem("young-certi/sessionId", "session-1");
  localStorage.setItem(
    "young-certi/v1/session-1/sets",
    JSON.stringify([
      {
        id: "set-1",
        name: "Review",
        createdAt: "2026-05-27T00:00:00.000Z",
        questionRefs,
      },
      {
        id: "set-2",
        name: "Hard",
        createdAt: "2026-05-27T00:00:00.000Z",
        questionRefs: [{ examSlug: "sap-c02", number: 1 }],
      },
    ]),
  );
}

function stubQuestions() {
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
        text: "Question 2?",
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

describe("SetSolvePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("solves questions within the set and stores results separately from practice and other sets", async () => {
    const user = userEvent.setup();
    storeSet();
    localStorage.setItem(
      "young-certi/v1/session-1/results",
      JSON.stringify({
        "sap-c02:1": {
          examSlug: "sap-c02",
          number: 1,
          selected: ["B"],
          submittedAt: "2026-05-27T00:00:00.000Z",
          correctness: "incorrect",
        },
      }),
    );
    localStorage.setItem("young-certi/v1/session-1/set-results/set-2", JSON.stringify({ 1: { selected: ["C"] } }));
    stubQuestions();

    renderSet();

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "세트 문제 목록" });
    expect(within(nav).getByRole("link", { name: "세트 문제 1 현재 미응답" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(screen.getByRole("button", { name: "제출" }));

    expect(screen.getByText("정답 선택")).toBeInTheDocument();
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByText("Question 2?")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument();

    const setResults = JSON.parse(localStorage.getItem("young-certi/v1/session-1/set-results/set-1") ?? "{}");
    expect(setResults["1"]).toEqual(expect.objectContaining({ selected: ["A"], correctness: "correct" }));
    expect(localStorage.getItem("young-certi/v1/session-1/results")).toContain("incorrect");
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-2")).toContain("C");
  });

  it("removes the current question from the set and keeps navigation usable", async () => {
    const user = userEvent.setup();
    storeSet();
    stubQuestions();

    renderSet();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "세트에서 제거" }));
    expect(screen.getByRole("dialog", { name: "세트 문항 제거 확인" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제거" }));

    await waitFor(() => expect(screen.queryByText("Question 1?")).not.toBeInTheDocument());
    expect(await screen.findByText("Question 2?")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]");
    expect(stored.find((set: { id: string }) => set.id === "set-1").questionRefs).toEqual([
      { examSlug: "sap-c02", number: 2 },
    ]);
  });

  it("marks missing questions as unavailable and skips to the next available item", async () => {
    const user = userEvent.setup();
    storeSet([{ examSlug: "sap-c02", number: 99 }, { examSlug: "sap-c02", number: 2 }]);
    stubQuestions();

    renderSet();

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(await screen.findByText("이 문항은 현재 문제 풀에 없습니다.")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "세트 문제 1 현재 사용 불가" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("Question 2?")).toBeInTheDocument();
  });
});
