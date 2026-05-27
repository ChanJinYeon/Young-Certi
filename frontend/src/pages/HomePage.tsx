import { useQuery } from "@tanstack/react-query";

import { fetchExams } from "../api/client";
import type { ExamSummary } from "../api/types";
import { CertCard } from "../components/CertCard";

const fallbackExams: ExamSummary[] = [
  {
    slug: "sap-c02",
    displayName: "AWS SAP-C02",
    version: "SAP on AWS - Specialty",
    totalQuestions: 0,
  },
];

export function HomePage() {
  const examsQuery = useQuery({
    queryKey: ["exams"],
    queryFn: fetchExams,
  });

  const exams = examsQuery.data && examsQuery.data.length > 0 ? examsQuery.data : fallbackExams;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <header className="space-y-3">
          <p className="text-sm font-medium text-zinc-500">자격증 문제 풀이</p>
          <h1 className="text-3xl font-semibold text-zinc-950">YoungCerti</h1>
          <p className="max-w-2xl leading-relaxed text-zinc-600">
            응시할 자격증을 선택해 바로 문제 풀이를 시작하세요.
          </p>
        </header>

        {examsQuery.isError ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            상세 정보는 잠시 후 다시 표시됩니다.
          </p>
        ) : null}

        <nav aria-label="자격증 목록" className="space-y-3">
          {exams.map((exam) => (
            <CertCard key={exam.slug} exam={exam} />
          ))}
        </nav>
      </div>
    </main>
  );
}
