import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PageHeader } from "../src/components/PageHeader";
import { ExamLandingPage } from "../src/pages/ExamLandingPage";
import { ExamPage } from "../src/pages/ExamPage";
import { HomePage } from "../src/pages/HomePage";
import { PracticePage } from "../src/pages/PracticePage";
import { SetSolvePage } from "../src/pages/SetSolvePage";
import { SetsListPage } from "../src/pages/SetsListPage";

function renderRoute(path: string, initialEntries = [path]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialEntries.length - 1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/:examSlug/" element={<ExamLandingPage />} />
          <Route path="/:examSlug/practice" element={<PracticePage />} />
          <Route path="/:examSlug/exam" element={<ExamPage />} />
          <Route path="/:examSlug/sets" element={<SetsListPage />} />
          <Route path="/:examSlug/sets/:setId" element={<SetSolvePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function stubApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("/exams")) {
        return Response.json([
          {
            slug: "sap-c02",
            displayName: "AWS SAP-C02",
            version: "SAP on AWS - Specialty",
            totalQuestions: 476,
          },
        ]);
      }
      if (url.endsWith("/exams/sap-c02/questions")) {
        return Response.json({ examSlug: "sap-c02", version: "fixture", total: 476, numbers: [1, 2] });
      }
      return Response.json({
        examSlug: "sap-c02",
        number: 1,
        text: "Question 1?",
        choices: [{ label: "A", text: "Amazon S3" }],
        answerKey: ["A"],
        explanation: "S3입니다.",
      });
    }),
  );
}

describe("PageHeader", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the shared header shape", () => {
    render(
      <MemoryRouter>
        <PageHeader
          backTo="/sap-c02/"
          backLabel="학습 모드로 돌아가기"
          eyebrow="AWS SAP-C02"
          title="문제집"
          description="저장해 둔 문제 묶음을 열어 필요한 범위만 다시 풉니다."
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "학습 모드로 돌아가기" })).toHaveAttribute("href", "/sap-c02/");
    expect(screen.getByText("AWS SAP-C02")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "문제집", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("저장해 둔 문제 묶음을 열어 필요한 범위만 다시 풉니다.")).toBeInTheDocument();
  });

  it("applies route-specific header labels and back targets", async () => {
    stubApi();
    localStorage.setItem("young-certi/sessionId", "session-1");
    localStorage.setItem(
      "young-certi/v1/session-1/sets",
      JSON.stringify([
        {
          id: "set-1",
          name: "오답노트",
          createdAt: "2026-05-28T00:00:00.000Z",
          questionRefs: [{ examSlug: "sap-c02", number: 1 }],
        },
      ]),
    );

    const home = renderRoute("/");
    expect(await screen.findByRole("heading", { name: "YoungCerti" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "홈으로" })).not.toBeInTheDocument();
    home.unmount();

    const landing = renderRoute("/sap-c02/");
    expect(await screen.findByRole("link", { name: "홈으로" })).toHaveAttribute("href", "/");
    expect(screen.getByText("SAP on AWS - Specialty")).toBeInTheDocument();
    expect(await screen.findByText("476문항")).toBeInTheDocument();
    landing.unmount();

    const practice = renderRoute("/sap-c02/practice");
    expect(await screen.findByText("Question 1?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeInTheDocument();
    // Eyebrow is the cert name across all sub-pages (practice/exam/sets/set-solve)
    // for a consistent "AWS SAP-C02" parent context (008 consistency pass).
    expect(screen.getByText("AWS SAP-C02")).toBeInTheDocument();
    practice.unmount();

    const sets = renderRoute("/sap-c02/sets");
    expect(await screen.findByRole("heading", { name: "문제집" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "학습 모드로 돌아가기" })).toHaveAttribute("href", "/sap-c02/");
    sets.unmount();

    const setSolve = renderRoute("/sap-c02/sets/set-1");
    expect(await screen.findByRole("heading", { name: "오답노트" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeInTheDocument();
    setSolve.unmount();
  });

  it("keeps the exam reset confirmation and returns to the previous page after confirm", async () => {
    const user = userEvent.setup();
    stubApi();

    renderRoute("/sap-c02/exam", ["/previous", "/sap-c02/exam"]);

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "시험 시작" }));
    expect(await screen.findByRole("heading", { name: "문제 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "이전 화면으로" }));
    const dialog = screen.getByRole("dialog", { name: "시험 나가기 확인" });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "초기화하고 이전으로" }));
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeInTheDocument();
  });
});
