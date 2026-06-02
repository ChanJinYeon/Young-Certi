import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { fetchQuestionNumbers } from "../api/client";
import { EntryCard } from "../components/EntryCard";
import { PageHeader } from "../components/PageHeader";

const knownExams = {
  "sap-c02": {
    displayName: "AWS SAP-C02",
    version: "SAP on AWS - Specialty",
  },
} as const;

export function ExamLandingPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const exam = knownExams[examSlug as keyof typeof knownExams];
  const questionNumbersQuery = useQuery({
    queryKey: ["question-numbers", examSlug],
    queryFn: () => fetchQuestionNumbers(examSlug),
    enabled: Boolean(exam),
  });

  if (!exam) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
          <PageHeader
            backTo="/"
            backLabel="홈으로"
            title="해당 시험을 찾을 수 없습니다"
            description="홈에서 사용 가능한 자격증을 다시 선택하세요."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <PageHeader
            backTo="/"
            backLabel="홈으로"
            eyebrow={exam.version}
            title={exam.displayName}
            description="학습 모드를 선택해 바로 시작하세요."
          />
          {questionNumbersQuery.data ? (
            <p className="pb-1 font-mono text-sm text-zinc-700">{questionNumbersQuery.data.total}문항</p>
          ) : null}
        </div>

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
          <EntryCard
            title="시험 모드"
            description="75문항을 무작위로 선택해 제한 시간 안에 풀이합니다. 시험 중에는 정답과 해설을 표시하지 않습니다."
            to={`/${examSlug}/exam`}
          />
          <EntryCard
            title="문제집"
            description="저장해 둔 문제 묶음을 열어 필요한 범위만 다시 풉니다."
            to={`/${examSlug}/sets`}
          />
        </section>
      </div>
    </main>
  );
}
