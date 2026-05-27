import { useMemo } from "react";

import { score as scoreQuestion } from "./usePerQuestionResult";
import { storageKey, useStoredState } from "./storage";

export type ExamAttemptStatus = "in-progress" | "submitted";

export type ExamScore = {
  correct: number;
  total: number;
  percent: number;
  pass: boolean;
};

export type ExamAttempt = {
  examSlug: string;
  questionNumbers: number[];
  answers: Record<number, string[]>;
  startedAt: string;
  durationMinutes: number;
  status: ExamAttemptStatus;
  submittedAt: string | null;
  score: ExamScore | null;
};

export type ExamGradingQuestion = {
  number: number;
  answerKey: string[];
};

type StartOptions = {
  durationMinutes?: number;
  extraTime?: boolean;
};

const EXAM_QUESTION_COUNT = 75;
const BASE_DURATION_MINUTES = 180;
const EXTRA_TIME_MINUTES = 30;

function attemptStorageKey(sessionId: string, examSlug: string): string {
  return storageKey(sessionId, `exam/${examSlug}`);
}

function shuffle(numbers: number[]): number[] {
  const shuffled = [...numbers];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function remainingSecondsFor(attempt: ExamAttempt | null): number {
  if (!attempt || attempt.status === "submitted") return 0;
  const started = new Date(attempt.startedAt).getTime();
  const endsAt = started + attempt.durationMinutes * 60_000;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function grade(questions: ExamGradingQuestion[], answers: Record<number, string[]>): ExamScore {
  let correct = 0;
  for (const question of questions) {
    if (scoreQuestion(answers[question.number] ?? [], question.answerKey) === "correct") {
      correct += 1;
    }
  }
  const total = questions.length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
  return {
    correct,
    total,
    percent,
    pass: percent >= 75,
  };
}

export function useExamAttempt(sessionId: string, examSlug: string) {
  const stored = useStoredState<ExamAttempt | null>(attemptStorageKey(sessionId, examSlug), null);
  const remainingSeconds = remainingSecondsFor(stored.value);

  return {
    attempt: stored.value,
    remainingSeconds,
    isExpired: Boolean(stored.value && stored.value.status === "in-progress" && remainingSeconds === 0),
    start: (numbers: number[], options: StartOptions = {}) => {
      const selected =
        numbers.length <= EXAM_QUESTION_COUNT ? [...numbers] : shuffle(numbers).slice(0, EXAM_QUESTION_COUNT);
      const durationMinutes =
        options.durationMinutes ??
        BASE_DURATION_MINUTES + (options.extraTime ? EXTRA_TIME_MINUTES : 0);
      stored.setValue({
        examSlug,
        questionNumbers: selected,
        answers: {},
        startedAt: new Date().toISOString(),
        durationMinutes,
        status: "in-progress",
        submittedAt: null,
        score: null,
      });
    },
    answer: (number: number, selected: string[]) => {
      stored.setValue((current) =>
        current
          ? {
              ...current,
              answers: {
                ...current.answers,
                [number]: selected,
              },
            }
          : current,
      );
    },
    submit: (questions: ExamGradingQuestion[]) => {
      stored.setValue((current) =>
        current
          ? {
              ...current,
              status: "submitted",
              submittedAt: new Date().toISOString(),
              score: grade(questions, current.answers),
            }
          : current,
      );
    },
    clear: () => stored.setValue(null),
  };
}

export function useExamAttemptStorageKey(sessionId: string, examSlug: string) {
  return useMemo(() => attemptStorageKey(sessionId, examSlug), [sessionId, examSlug]);
}
