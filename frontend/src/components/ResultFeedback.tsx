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
    <section aria-label="채점 결과" className="space-y-3 rounded border border-zinc-200 p-4">
      {question.choices.map((choice) => {
        const picked = selectedSet.has(choice.label);
        const correct = answerSet.has(choice.label);
        const label = picked && correct ? "정답 선택" : picked ? "오답 선택" : correct ? "놓친 정답" : null;
        return label ? (
          <div key={choice.label} className={correct ? "text-emerald-700" : "text-rose-700"}>
            <strong>{label}</strong> {choice.label}
          </div>
        ) : null;
      })}
      <p>{question.explanation ?? "해설 없음"}</p>
    </section>
  );
}

