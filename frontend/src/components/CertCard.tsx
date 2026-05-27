import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { ExamSummary } from "../api/types";

type CertCardProps = {
  exam: ExamSummary;
};

export function CertCard({ exam }: CertCardProps) {
  return (
    <Link
      to={`/${exam.slug}/`}
      className="group block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      <div className="flex min-h-20 items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900">{exam.displayName}</h2>
          <p className="text-sm text-zinc-500">{exam.version}</p>
          {exam.totalQuestions > 0 ? (
            <p className="font-mono text-sm text-zinc-700">{exam.totalQuestions}문항</p>
          ) : null}
        </div>
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors group-hover:border-zinc-300 group-hover:text-zinc-900">
          <ArrowRight aria-hidden size={18} />
        </span>
      </div>
    </Link>
  );
}
