import { createClientId } from "../lib/id";
import { storageKey, useStoredState } from "./storage";

export type QuestionRef = {
  examSlug: string;
  number: number;
};

export type QuestionSetSortMode = "added" | "number";

export type QuestionSet = {
  id: string;
  name: string;
  createdAt: string;
  questionRefs: QuestionRef[];
  sortMode?: QuestionSetSortMode;
};

function sameRef(left: QuestionRef, right: QuestionRef): boolean {
  return left.examSlug === right.examSlug && left.number === right.number;
}

function uniqueRefs(refs: QuestionRef[]): QuestionRef[] {
  return refs.reduce<QuestionRef[]>((unique, ref) => {
    return unique.some((item) => sameRef(item, ref)) ? unique : [...unique, ref];
  }, []);
}

export function getSortedRefs(set: QuestionSet): QuestionRef[] {
  const refs = [...set.questionRefs];
  if ((set.sortMode ?? "added") === "number") {
    refs.sort((left, right) => left.number - right.number || left.examSlug.localeCompare(right.examSlug));
  }
  return refs;
}

export function useQuestionSets(sessionId: string) {
  const stored = useStoredState<QuestionSet[]>(storageKey(sessionId, "sets"), []);

  return {
    sets: stored.value,
    createSet: (name: string): { ok: true; id: string } | { error: "blank" | "duplicate" } => {
      const trimmed = name.trim();
      if (!trimmed) return { error: "blank" };
      if (stored.value.some((set) => set.name === trimmed)) return { error: "duplicate" };
      const id = createClientId("set");
      stored.setValue((current) => [
        {
          id,
          name: trimmed,
          createdAt: new Date().toISOString(),
          questionRefs: [],
        },
        ...current,
      ]);
      return { ok: true, id };
    },
    createSetWithRefs: (
      name: string,
      refs: QuestionRef[],
    ): { ok: true; id: string } | { error: "blank" | "duplicate" } => {
      const trimmed = name.trim();
      if (!trimmed) return { error: "blank" };
      if (stored.value.some((set) => set.name === trimmed)) return { error: "duplicate" };
      const id = createClientId("set");
      const questionRefs = uniqueRefs(refs);
      stored.setValue((current) => [
        {
          id,
          name: trimmed,
          createdAt: new Date().toISOString(),
          questionRefs,
        },
        ...current,
      ]);
      return { ok: true, id };
    },
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
          {
            id: createClientId("set"),
            name: trimmed,
            createdAt: new Date().toISOString(),
            questionRefs: [ref],
          },
          ...current,
        ];
      });
    },
    setSortMode: (setId: string, mode: QuestionSetSortMode) => {
      stored.setValue((current) =>
        current.map((set) => (set.id === setId ? { ...set, sortMode: mode } : set)),
      );
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
