import type { Question } from "../api/types";
import type { ExamAttempt } from "../hooks/useExamAttempt";

type ExamResultProps = {
  attempt: ExamAttempt;
  questions: Question[];
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

export function ExamResult({ attempt, questions }: ExamResultProps) {
  const score = attempt.score ?? { correct: 0, total: questions.length, percent: 0, pass: false };
  const badgeClass = score.pass
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-zinc-300 bg-zinc-100 text-zinc-700";

  return (
    <section className="space-y-5" aria-labelledby="exam-result-title">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">AWS SAP-C02</p>
            <h1 id="exam-result-title" className="text-3xl font-semibold text-zinc-950">
              시험 결과
            </h1>
          </div>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${badgeClass}`}>
            {score.pass ? "합격" : "불합격"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm text-zinc-500">정답 수</p>
            <p className="font-mono text-3xl font-semibold text-zinc-950">
              {score.correct} / {score.total}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">정답률</p>
            <p className="font-mono text-3xl font-semibold text-zinc-950">{score.percent}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((question) => {
          const selected = attempt.answers[question.number] ?? [];
          return (
            <article key={question.number} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">문제 {question.number}</h2>
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
