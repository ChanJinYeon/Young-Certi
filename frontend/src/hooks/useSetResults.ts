import { storageKey, useStoredState } from "./storage";
import type { PerQuestionResult } from "./usePerQuestionResult";

export type SetResult = PerQuestionResult;

export function useSetResults(sessionId: string, setId: string) {
  const stored = useStoredState<Record<number, SetResult>>(storageKey(sessionId, `set-results/${setId}`), {});

  return {
    results: stored.value,
    getResult: (number: number) => stored.value[number],
    saveResult: (result: SetResult) => {
      stored.setValue((current) => ({
        ...current,
        [result.number]: result,
      }));
    },
    clearResult: (number: number) => {
      stored.setValue((current) => {
        const next = { ...current };
        delete next[number];
        return next;
      });
    },
  };
}
