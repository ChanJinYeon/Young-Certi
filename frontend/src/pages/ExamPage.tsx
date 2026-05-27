import { useParams } from "react-router-dom";

import { useExamAttempt } from "../hooks/useExamAttempt";
import { useLocalSession } from "../hooks/useLocalSession";

export function ExamPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const { sessionId } = useLocalSession();
  const examAttempt = useExamAttempt(sessionId, examSlug);

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
        <p className="text-sm font-medium text-zinc-500">AWS SAP-C02</p>
        <h1 className="text-3xl font-semibold text-zinc-950">시험 모드</h1>
        <p className="leading-relaxed text-zinc-600">
          시험 응시 화면은 다음 작업에서 채웁니다. 현재는 시험 attempt 상태 기반을 준비했습니다.
        </p>
        <dl className="grid gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">상태</dt>
            <dd className="font-medium text-zinc-900">{examAttempt.attempt?.status ?? "시작 전"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">남은 시간</dt>
            <dd className="font-mono text-zinc-900">{examAttempt.remainingSeconds}초</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
