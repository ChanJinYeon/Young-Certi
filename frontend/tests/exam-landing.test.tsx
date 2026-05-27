import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExamLandingPage } from "../src/pages/ExamLandingPage";

function renderLanding(path = "/sap-c02/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:examSlug/" element={<ExamLandingPage />} />
          <Route path="/:examSlug/practice" element={<h1>문제 풀이 화면</h1>} />
          <Route path="/" element={<h1>홈</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubQuestionNumbers(status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      status === 200
        ? Response.json({ examSlug: "sap-c02", version: "v2025-11-26", total: 476, numbers: [1, 2] })
        : Response.json(
            { code: "POOL_UNAVAILABLE", message: "문제 풀을 불러오지 못했습니다.", requestId: "req-1" },
            { status },
          ),
    ),
  );
}

describe("ExamLandingPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders active and disabled entries, count, and navigates to practice", async () => {
    const user = userEvent.setup();
    stubQuestionNumbers();

    renderLanding();

    expect(await screen.findByRole("heading", { name: "AWS SAP-C02" })).toBeInTheDocument();
    expect(await screen.findByText("476문항")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /문제 풀이/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /시험 모드/ })).toBeInTheDocument();
    expect(screen.getAllByText("준비 중")).toHaveLength(1);

    await user.click(screen.getByRole("link", { name: /문제 풀이/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "문제 풀이 화면" })).toBeInTheDocument());
  });

  it("omits the count when question metadata cannot be fetched", async () => {
    stubQuestionNumbers(503);

    renderLanding();

    expect(await screen.findByRole("heading", { name: "AWS SAP-C02" })).toBeInTheDocument();
    expect(screen.queryByText(/문항$/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /문제 풀이/ })).toBeInTheDocument();
  });

  it("shows resume when a saved current question exists", async () => {
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem("young-certi/v1/session-1/current", JSON.stringify({ "sap-c02": 42 }));
    stubQuestionNumbers();

    renderLanding();

    expect(await screen.findByRole("link", { name: /이어 풀기.*42번/ })).toBeInTheDocument();
  });

  it("renders not found for unknown exams with a home link", async () => {
    stubQuestionNumbers();

    renderLanding("/unknown/");

    expect(await screen.findByText("해당 시험을 찾을 수 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /문제 풀이/ })).not.toBeInTheDocument();
  });
});
