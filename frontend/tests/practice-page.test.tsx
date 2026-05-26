import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PracticePage } from "../src/pages/PracticePage";

function renderPractice(path = "/sap-c02/practice/1") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:examSlug/practice/:n" element={<PracticePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PracticePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("fetches a question, rejects empty submit, submits, and navigates next", async () => {
    const user = userEvent.setup();
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
          explanation: null,
        });
      }),
    );

    renderPractice();

    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("선지를 하나 이상 선택하세요.")).toBeInTheDocument();

    await user.click(screen.getByLabelText("A. Amazon S3"));
    await user.click(screen.getByRole("button", { name: "제출" }));
    expect(screen.getByText("S3입니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다음" }));
    await waitFor(() => expect(screen.getByText("Question 2?")).toBeInTheDocument());
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

