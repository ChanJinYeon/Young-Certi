import type { ReactNode } from "react";

import type { Question } from "../api/types";
import type { Correctness } from "../hooks/usePerQuestionResult";

type ExamResultProps = {
  question: Question;
  displayNumber?: number;
  selected: string[];
  correctness: Correctness;
  actions?: ReactNode;
};

function labelsFor(question: Question, labels: string[]): string {
  if (labels.length === 0) return "미응답";
  return labels
    .map((label) => {
      const choice = question.choices.find((item) => item.label === label);
      return choice ? `${choice.label}. ${choice.text}` : label;
    })
    .join(", ");
}

export function ExamResult({ question, displayNumber = question.number, selected, correctness, actions }: ExamResultProps) {
  const correct = correctness === "correct";
  const correctnessLabel = correct ? "정답" : "오답";

  return (
    <article
      id={`q-${displayNumber}`}
      aria-label={`문제 ${displayNumber} ${correctnessLabel}`}
      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950">문제 {displayNumber}</h2>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
            correct
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {correctnessLabel}
        </span>
      </div>
      <p className="mt-2 leading-relaxed text-zinc-800">{question.text}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-zinc-500">내 답</dt>
          <dd className="text-zinc-900">내 답: {labelsFor(question, selected)}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">정답</dt>
          <dd className="text-zinc-900">정답: {labelsFor(question, question.answerKey)}</dd>
        </div>
      </dl>
      {question.explanation ? (
        <p className="mt-4 rounded-md bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-700">
          {question.explanation}
        </p>
      ) : null}
      {actions ? <div className="mt-4 flex justify-end">{actions}</div> : null}
    </article>
  );
}
