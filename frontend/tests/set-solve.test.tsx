import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SetSolvePage } from "../src/pages/SetSolvePage";
import { SetsListPage } from "../src/pages/SetsListPage";

function renderSet(path = "/sap-c02/sets/set-1", initialEntries = [path]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
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

function stubQuestions(numbers = [1, 2]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/exams/sap-c02/questions")) {
        return Response.json({ examSlug: "sap-c02", version: "fixture", total: numbers.length, numbers });
      }
      const match = url.match(/\/questions\/(\d+)$/);
      const number = match ? Number(match[1]) : 1;
      if (number === 1 || number === 47) {
        return Response.json({
          examSlug: "sap-c02",
          number,
          text: `Question ${number}?`,
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
        number,
        text: `Question ${number}?`,
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

function storeSortableSet() {
  localStorage.setItem("young-certi/sessionId", "session-1");
  localStorage.setItem(
    "young-certi/v1/session-1/sets",
    JSON.stringify([
      {
        id: "set-1",
        name: "Review",
        createdAt: "2026-05-27T00:00:00.000Z",
        questionRefs: [
          { examSlug: "sap-c02", number: 230 },
          { examSlug: "sap-c02", number: 47 },
          { examSlug: "sap-c02", number: 128 },
        ],
      },
    ]),
  );
}

function navLabels() {
  return screen
    .getAllByRole("link", { name: /세트 문제/ })
    .map((link) => link.textContent?.trim())
    .filter(Boolean);
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
    const topBar = screen.getByTestId("study-two-pane-top-bar");
    expect(topBar.firstElementChild).toHaveClass("grid-cols-[3.5rem_minmax(0,1fr)_3.5rem]");
    const pager = within(topBar).getByRole("group", { name: "문제 이동" });
    expect(within(topBar).getByRole("button", { name: "이전 화면으로" })).toHaveTextContent("이전");
    expect(within(topBar).getByRole("heading", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByTestId("set-solve-study-content")).toHaveClass("xl:-translate-x-[7.5rem]");
    expect(within(pager).getByRole("button", { name: "이전" })).toBeDisabled();
    expect(within(pager).getByText("1 / 2")).toBeInTheDocument();
    expect(within(pager).getByRole("button", { name: "다음" })).toBeEnabled();
    await user.click(within(topBar).getByRole("button", { name: "정렬: 추가한 순서" }));
    expect(screen.getByRole("menu", { name: "문제집 정렬" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "문제 번호 순" }));
    expect(within(topBar).getByRole("button", { name: "정렬: 문제 번호 순" })).toBeInTheDocument();
    expect(within(topBar).queryByRole("button", { name: "세트에서 제거" })).not.toBeInTheDocument();
    expect(screen.getByTestId("set-solve-sidebar-shell")).toHaveClass("lg:min-h-[calc(100vh-3.5rem)]");
    const nav = screen.getByRole("navigation", { name: "세트 문제 목록" });
    expect(within(nav).getByRole("link", { name: "세트 문제 1 현재 미응답" })).toBeInTheDocument();
    const bottomControls = screen.getByRole("group", { name: "세트 하단 컨트롤" });
    expect(within(bottomControls).getByRole("button", { name: "제거" })).toBeInTheDocument();
    expect(within(bottomControls).getByRole("button", { name: "제출" })).toBeInTheDocument();
    expect(bottomControls.textContent).toMatch(/제거\s*제출/);

    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(screen.getByRole("button", { name: "제출" }));

    expect(screen.getByText("정답 선택")).toBeInTheDocument();
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();

    await user.click(within(pager).getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByText("Question 2?")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Review" })).toBeInTheDocument();

    const setResults = JSON.parse(localStorage.getItem("young-certi/v1/session-1/set-results/set-1") ?? "{}");
    expect(setResults["1"]).toEqual(expect.objectContaining({ selected: ["A"], correctness: "correct" }));
    expect(localStorage.getItem("young-certi/v1/session-1/results")).toContain("incorrect");
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-2")).toContain("C");
  });

  it("uses browser history for the top-bar back button", async () => {
    const user = userEvent.setup();
    storeSet();
    stubQuestions();

    renderSet("/sap-c02/sets/set-1", ["/previous", "/sap-c02/sets/set-1"]);

    expect(await screen.findByRole("heading", { name: "Review" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));

    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeInTheDocument();
  });

  it("removes the current question from the set and keeps navigation usable", async () => {
    const user = userEvent.setup();
    storeSet();
    stubQuestions();

    renderSet();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제거" }));
    const dialog = screen.getByRole("dialog", { name: "세트 문항 제거 확인" });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "제거" }));

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
    expect(await screen.findByRole("link", { name: "세트 문제 99 현재 사용 불가" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByText("Question 2?")).toBeInTheDocument();
  });

  it("uses canonical question numbers in the sidebar and reorders sidebar plus nav by sort mode", async () => {
    const user = userEvent.setup();
    storeSortableSet();
    stubQuestions([47, 128, 230]);

    const view = renderSet();

    expect(await screen.findByText("Question 230?")).toBeInTheDocument();
    expect(navLabels()).toEqual(["230", "47", "128"]);

    await user.click(screen.getByRole("button", { name: "정렬: 추가한 순서" }));
    await user.click(screen.getByRole("menuitem", { name: "문제 번호 순" }));
    expect(navLabels()).toEqual(["47", "128", "230"]);
    expect(await screen.findByText("Question 47?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(await screen.findByText("Question 128?")).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]");
    expect(stored[0].sortMode).toBe("number");

    view.unmount();
    renderSet();
    expect(await screen.findByText("Question 47?")).toBeInTheDocument();
    expect(navLabels()).toEqual(["47", "128", "230"]);
    expect(screen.getByRole("button", { name: "정렬: 문제 번호 순" })).toBeInTheDocument();
  });

  it("keeps results keyed by canonical number when sort order changes", async () => {
    const user = userEvent.setup();
    storeSortableSet();
    stubQuestions([47, 128, 230]);

    renderSet();

    expect(await screen.findByText("Question 230?")).toBeInTheDocument();
    await user.click(screen.getByLabelText("B. Amazon EC2"));
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("EC2입니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "정렬: 추가한 순서" }));
    await user.click(screen.getByRole("menuitem", { name: "문제 번호 순" }));

    const setResults = JSON.parse(localStorage.getItem("young-certi/v1/session-1/set-results/set-1") ?? "{}");
    expect(setResults["230"]).toEqual(expect.objectContaining({ selected: ["B"], correctness: "correct" }));
    expect(setResults["47"]).toBeUndefined();
  });

  it("preserves a set after removing its last question and opens it as an empty state", async () => {
    const user = userEvent.setup();
    storeSet([{ examSlug: "sap-c02", number: 1 }]);
    stubQuestions();

    renderSet();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제거" }));
    await user.click(within(screen.getByRole("dialog", { name: "세트 문항 제거 확인" })).getByRole("button", { name: "제거" }));

    expect(await screen.findByText("이 문제집에는 아직 문항이 없습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "이전" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다음" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "문제집 목록으로 이동" })).toHaveAttribute("href", "/sap-c02/sets");

    const stored = JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]");
    expect(stored.find((set: { id: string }) => set.id === "set-1")).toEqual(
      expect.objectContaining({ name: "Review", questionRefs: [] }),
    );
  });
});
