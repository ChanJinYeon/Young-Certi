import type { Question } from "../api/types";

type Props = {
  question: Question;
  selected: string[];
  submitted: boolean;
};

export function ResultFeedback({ question, selected, submitted }: Props) {
  if (!submitted) return null;
  const selectedSet = new Set(selected);
  const answerSet = new Set(question.answerKey);

  return (
    <section
      aria-label="채점 결과"
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <ul className="space-y-1.5">
        {question.choices.map((choice) => {
          const picked = selectedSet.has(choice.label);
          const correct = answerSet.has(choice.label);
          const label = picked && correct ? "정답 선택" : picked ? "오답 선택" : correct ? "놓친 정답" : null;
          if (!label) return null;
          return (
            <li
              key={choice.label}
              className={`flex items-center gap-2 text-sm ${correct ? "text-emerald-700" : "text-rose-700"}`}
            >
              <span className="font-mono font-semibold">{choice.label}</span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <hr className="border-zinc-200" />
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-zinc-500">해설</h2>
        <p className="leading-relaxed text-zinc-800">{question.explanation ?? "해설 없음"}</p>
      </div>
    </section>
  );
}
