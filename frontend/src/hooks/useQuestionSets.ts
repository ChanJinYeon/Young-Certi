import { createClientId } from "../lib/id";
import { storageKey, useStoredState } from "./storage";

export type QuestionRef = {
  examSlug: string;
  number: number;
};

export type QuestionSet = {
  id: string;
  name: string;
  createdAt: string;
  questionRefs: QuestionRef[];
};

function sameRef(left: QuestionRef, right: QuestionRef): boolean {
  return left.examSlug === right.examSlug && left.number === right.number;
}

export function useQuestionSets(sessionId: string) {
  const stored = useStoredState<QuestionSet[]>(storageKey(sessionId, "sets"), []);

  return {
    sets: stored.value,
    addToSet: (name: string, ref: QuestionRef) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      stored.setValue((current) => {
        const existing = current.find((set) => set.name === trimmed);
        if (existing) {
          return current.map((set) =>
            set.id === existing.id
              ? {
                  ...set,
                  questionRefs: set.questionRefs.some((item) => sameRef(item, ref))
                    ? set.questionRefs
                    : [...set.questionRefs, ref],
                }
              : set,
          );
        }
        return [
          ...current,
          {
            id: createClientId("set"),
            name: trimmed,
            createdAt: new Date().toISOString(),
            questionRefs: [ref],
          },
        ];
      });
    },
    deleteSet: (id: string) => {
      stored.setValue((current) => current.filter((set) => set.id !== id));
      try {
        localStorage.removeItem(storageKey(sessionId, `set-results/${id}`));
      } catch {
        // Storage can be unavailable in private/quota-restricted contexts.
      }
    },
    removeQuestion: (setId: string, ref: QuestionRef) => {
      stored.setValue((current) =>
        current.map((set) =>
          set.id === setId
            ? {
                ...set,
                questionRefs: set.questionRefs.filter((item) => !sameRef(item, ref)),
              }
            : set,
        ),
      );
    },
  };
}
