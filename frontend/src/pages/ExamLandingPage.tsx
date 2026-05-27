import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { fetchQuestionNumbers } from "../api/client";
import { EntryCard } from "../components/EntryCard";
import { storageKey } from "../hooks/storage";
import { useLocalSession } from "../hooks/useLocalSession";

const knownExams = {
  "sap-c02": {
    displayName: "AWS SAP-C02",
    version: "SAP on AWS - Specialty",
  },
} as const;

function readCurrentQuestion(sessionId: string, examSlug: string): number | null {
  const raw = localStorage.getItem(storageKey(sessionId, "current"));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const value = parsed[examSlug];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function ExamLandingPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const exam = knownExams[examSlug as keyof typeof knownExams];
  const { sessionId } = useLocalSession();
  const currentQuestion = exam ? readCurrentQuestion(sessionId, examSlug) : null;
  const questionNumbersQuery = useQuery({
    queryKey: ["question-numbers", examSlug],
    queryFn: () => fetchQuestionNumbers(examSlug),
    enabled: Boolean(exam),
  });

  if (!exam) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
          <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            홈으로
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950">해당 시험을 찾을 수 없습니다</h1>
          <p className="text-zinc-600">홈에서 사용 가능한 자격증을 다시 선택하세요.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          홈으로
        </Link>
        <header className="space-y-3">
          <p className="text-sm font-medium text-zinc-500">{exam.version}</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-3xl font-semibold text-zinc-950">{exam.displayName}</h1>
            {questionNumbersQuery.data ? (
              <p className="font-mono text-sm text-zinc-700">{questionNumbersQuery.data.total}문항</p>
            ) : null}
          </div>
          <p className="max-w-2xl leading-relaxed text-zinc-600">
            학습 모드를 선택하세요. 지금은 문제 풀이만 사용할 수 있습니다.
          </p>
        </header>

        {questionNumbersQuery.isError ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            총 문항 수는 잠시 후 다시 표시됩니다.
          </p>
        ) : null}

        <section aria-label="학습 모드" className="grid gap-3">
          <EntryCard
            title="문제 풀이"
            description="저장된 진행 상태를 유지하며 문제를 풉니다."
            to={`/${examSlug}/practice`}
          />
          {currentQuestion ? (
            <Link
              to={`/${examSlug}/practice`}
              className="inline-flex min-h-11 w-fit items-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
            >
              이어 풀기 · {currentQuestion}번
            </Link>
          ) : null}
          <EntryCard
            title="시험 모드"
            description="제한 시간 안에 75문항을 풀고 결과를 확인합니다."
            to={`/${examSlug}/exam`}
          />
          <EntryCard title="문제집" description="사용자 지정 문제 묶음은 준비 중입니다." disabled />
        </section>
      </div>
    </main>
  );
}
