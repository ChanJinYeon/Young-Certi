import { storageKey, useStoredState } from "./storage";

export type Correctness = "correct" | "partial" | "incorrect" | null;

export type PerQuestionResult = {
  examSlug: string;
  number: number;
  selected: string[];
  submittedAt: string | null;
  correctness: Correctness;
};

function resultKey(examSlug: string, number: number): string {
  return `${examSlug}:${number}`;
}

export function usePerQuestionResult(sessionId: string) {
  const results = useStoredState<Record<string, PerQuestionResult>>(storageKey(sessionId, "results"), {});

  return {
    results: results.value,
    getResult: (examSlug: string, number: number) => results.value[resultKey(examSlug, number)],
    saveResult: (result: PerQuestionResult) => {
      results.setValue((current) => ({
        ...current,
        [resultKey(result.examSlug, result.number)]: result,
      }));
    },
  };
}

export function score(selected: string[], answerKey: string[]): Correctness {
  const selectedSet = new Set(selected);
  const answerSet = new Set(answerKey);
  const wrong = selected.some((label) => !answerSet.has(label));
  const missed = answerKey.some((label) => !selectedSet.has(label));
  if (!wrong && !missed) return "correct";
  if (!wrong && selected.length > 0) return "partial";
  return "incorrect";
}

