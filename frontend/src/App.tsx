import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ExamLandingPage } from "./pages/ExamLandingPage";
import { ExamPage } from "./pages/ExamPage";
import { HomePage } from "./pages/HomePage";
import { PracticePage } from "./pages/PracticePage";
import { SetsListPage } from "./pages/SetsListPage";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:examSlug/" element={<ExamLandingPage />} />
          <Route path="/:examSlug/exam" element={<ExamPage />} />
          <Route path="/:examSlug/practice" element={<PracticePage />} />
          <Route path="/:examSlug/sets" element={<SetsListPage />} />
          <Route
            path="/:examSlug/sets/:setId"
            element={
              <main className="min-h-screen bg-zinc-50 p-6">
                <h1>세트 풀이 준비 중</h1>
              </main>
            }
          />
          <Route path="*" element={<Navigate to="/sap-c02/practice" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
