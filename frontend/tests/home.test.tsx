import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "../src/pages/HomePage";

function renderHome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:examSlug/" element={<h1>시험 랜딩</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders certifications from exams and navigates to the exam landing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            slug: "sap-c02",
            displayName: "AWS SAP-C02",
            version: "v2025-11-26",
            totalQuestions: 476,
          },
        ]),
      ),
    );

    renderHome();

    expect(await screen.findByRole("heading", { name: "YoungCerti" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /AWS SAP-C02/ })).toBeInTheDocument();
    expect(screen.getByText("476문항")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /AWS SAP-C02/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "시험 랜딩" })).toBeInTheDocument());
  });

  it("keeps the home usable when exams cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { code: "POOL_UNAVAILABLE", message: "문제 풀을 불러오지 못했습니다.", requestId: "req-1" },
          { status: 503 },
        ),
      ),
    );

    renderHome();

    expect(await screen.findByRole("link", { name: /AWS SAP-C02/ })).toBeInTheDocument();
    expect(screen.queryByText(/문항$/)).not.toBeInTheDocument();
  });
});
