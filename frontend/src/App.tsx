import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { PracticePage } from "./pages/PracticePage";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/:examSlug/practice/:n" element={<PracticePage />} />
          <Route path="*" element={<Navigate to="/sap-c02/practice/1" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

