import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SetsListPage } from "../src/pages/SetsListPage";

function renderSets(path = "/sap-c02/sets") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:examSlug/sets" element={<SetsListPage />} />
        <Route path="/:examSlug/sets/:setId" element={<h1>세트 풀이 스텁</h1>} />
        <Route path="/:examSlug/practice" element={<h1>문제 풀이</h1>} />
        <Route path="/:examSlug/" element={<h1>학습 모드</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

function storeSets() {
  localStorage.setItem("young-certi/sessionId", "session-1");
  localStorage.setItem(
    "young-certi/v1/session-1/sets",
    JSON.stringify([
      {
        id: "set-1",
        name: "Review",
        createdAt: "2026-05-27T00:00:00.000Z",
        questionRefs: [
          { examSlug: "sap-c02", number: 1 },
          { examSlug: "sap-c02", number: 2 },
        ],
      },
      {
        id: "set-2",
        name: "Hard",
        createdAt: "2026-05-27T00:00:00.000Z",
        questionRefs: [{ examSlug: "sap-c02", number: 3 }],
      },
    ]),
  );
}

function storeEmptyAndOneQuestionSets() {
  localStorage.setItem("young-certi/sessionId", "session-1");
  localStorage.setItem(
    "young-certi/v1/session-1/sets",
    JSON.stringify([
      {
        id: "set-empty",
        name: "Empty",
        createdAt: "2026-05-28T00:00:00.000Z",
        questionRefs: [],
      },
      {
        id: "set-one",
        name: "One",
        createdAt: "2026-05-28T00:00:00.000Z",
        questionRefs: [{ examSlug: "sap-c02", number: 1 }],
      },
    ]),
  );
}

describe("SetsListPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders an empty state that points learners back to add questions from practice", async () => {
    localStorage.setItem("young-certi/sessionId", "session-1");

    renderSets();

    expect(await screen.findByRole("heading", { name: "문제집" })).toBeInTheDocument();
    expect(screen.getByText(/문제 풀이 화면에서/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "문제 풀이로 이동" })).toHaveAttribute("href", "/sap-c02/practice");
  });

  it("lists saved sets with counts and opens a selected set", async () => {
    const user = userEvent.setup();
    storeSets();

    renderSets();

    const review = await screen.findByRole("article", { name: "Review 문제집" });
    expect(within(review).getByText("2문항")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Hard 문제집" })).toHaveTextContent("1문항");
    expect(within(review).getByRole("link", { name: "Review 열기" })).toHaveTextContent(/^열기$/);
    expect(within(review).getByRole("button", { name: "Review 삭제" })).toHaveTextContent(/^삭제$/);

    await user.click(within(review).getByRole("link", { name: "Review 열기" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "세트 풀이 스텁" })).toBeInTheDocument());
  });

  it("deletes a set after confirmation without affecting other sets", async () => {
    const user = userEvent.setup();
    storeSets();
    localStorage.setItem("young-certi/v1/session-1/set-results/set-1", JSON.stringify({ 1: { selected: ["A"] } }));
    localStorage.setItem("young-certi/v1/session-1/set-results/set-2", JSON.stringify({ 3: { selected: ["B"] } }));

    renderSets();

    await user.click(within(await screen.findByRole("article", { name: "Review 문제집" })).getByRole("button", {
      name: "Review 삭제",
    }));
    expect(screen.getByRole("dialog", { name: "문제집 삭제 확인" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByRole("article", { name: "Review 문제집" })).toBeInTheDocument();

    await user.click(within(screen.getByRole("article", { name: "Review 문제집" })).getByRole("button", {
      name: "Review 삭제",
    }));
    await user.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.queryByRole("article", { name: "Review 문제집" })).not.toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Hard 문제집" })).toBeInTheDocument();
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-1")).toBeNull();
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-2")).toContain("B");
  });

  it("creates empty sets inline and validates blank or duplicate names", async () => {
    const user = userEvent.setup();
    localStorage.setItem("young-certi/sessionId", "session-1");

    renderSets();

    await user.click(await screen.findByRole("button", { name: "문제집 추가" }));
    const input = screen.getByLabelText("문제집 이름");

    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByText("문제집 이름을 입력하세요.")).toBeInTheDocument();

    await user.type(input, "Review");
    await user.click(screen.getByRole("button", { name: "확인" }));
    const review = await screen.findByRole("article", { name: "Review 문제집" });
    expect(within(review).getByLabelText("문제 0개")).toHaveTextContent("0문항");

    await user.click(screen.getByRole("button", { name: "문제집 추가" }));
    await user.type(screen.getByLabelText("문제집 이름"), "Review");
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(screen.getByText("이미 같은 이름의 문제집이 있습니다.")).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(expect.objectContaining({ name: "Review", questionRefs: [] }));
  });

  it("keeps empty sets visible with a 0-question badge", async () => {
    storeEmptyAndOneQuestionSets();

    renderSets();

    const empty = await screen.findByRole("article", { name: "Empty 문제집" });
    expect(within(empty).getByLabelText("문제 0개")).toHaveTextContent("0문항");
    expect(screen.getByRole("article", { name: "One 문제집" })).toHaveTextContent("1문항");
  });
});
