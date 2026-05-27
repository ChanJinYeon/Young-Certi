import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { FavoriteToggle } from "../components/FavoriteToggle";
import { QuestionSetPicker } from "../components/QuestionSetPicker";
import { ResultFeedback } from "../components/ResultFeedback";
import { SideMenu } from "../components/SideMenu";
import { ApiError } from "../lib/error";
import { useFavorites } from "../hooks/useFavorites";
import { useLocalSession } from "../hooks/useLocalSession";
import { score, usePerQuestionResult, type Correctness } from "../hooks/usePerQuestionResult";
import { useQuestionSets } from "../hooks/useQuestionSets";
import { storageKey, useStoredState } from "../hooks/storage";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50";

export function PracticePage() {
  const params = useParams();
  const examSlug = params.examSlug ?? "sap-c02";
  const { sessionId, isEphemeral } = useLocalSession();
  // Current question lives in client state (persisted), not the URL — the URL
  // stays at /:examSlug/practice and navigation is in-page (no remount, scroll
  // preserved). localStorage restores the last question on reload.
  const currentStore = useStoredState<Record<string, number>>(storageKey(sessionId, "current"), {});
  const validNumber = currentStore.value[examSlug] ?? 1;
  const favorites = useFavorites(sessionId);
  const results = usePerQuestionResult(sessionId);
  const sets = useQuestionSets(sessionId);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const numbersQuery = useQuery({
    queryKey: ["question-numbers", examSlug],
    queryFn: () => fetchQuestionNumbers(examSlug),
  });
  const questionQuery = useQuery({
    queryKey: ["question", examSlug, validNumber],
    queryFn: () => fetchQuestion(examSlug, validNumber),
    // Keep the previous question mounted while the next loads so the side
    // menu doesn't unmount (preserves its scroll position) and the swap is
    // smooth instead of flashing the loading skeleton.
    placeholderData: keepPreviousData,
  });

  const statuses = useMemo<Record<number, Correctness>>(() => {
    const map: Record<number, Correctness> = {};
    for (const result of Object.values(results.results)) {
      if (result.examSlug === examSlug && result.submittedAt) {
        map[result.number] = result.correctness;
      }
    }
    return map;
  }, [examSlug, results.results]);

  const question = questionQuery.data;
  const numbers = numbersQuery.data?.numbers ?? [];
  const index = numbers.indexOf(validNumber);
  const error = questionQuery.error ?? numbersQuery.error;
  const savedResult = results.getResult(examSlug, validNumber);

  useEffect(() => {
    setSelected(savedResult?.selected ?? []);
    setSubmitted(Boolean(savedResult?.submittedAt));
    setSubmitError("");
  }, [examSlug, savedResult, validNumber]);

  if (error) {
    const envelope = error instanceof ApiError ? error.envelope : null;
    const message = envelope?.message ?? "문제를 불러오지 못했습니다.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-rose-700">{message}</p>
          {envelope ? (
            <p className="font-mono text-xs text-zinc-500">
              {envelope.code} · {envelope.requestId}
            </p>
          ) : null}
          <button type="button" onClick={() => window.location.reload()} className={ghostButton}>
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
        <div aria-hidden className="h-12 animate-pulse bg-zinc-100 lg:h-auto lg:w-60" />
        <main className="flex-1 p-6">
          <p className="text-zinc-500">문제를 불러오는 중…</p>
        </main>
      </div>
    );
  }

  function goTo(number: number) {
    currentStore.setValue((current) => ({ ...current, [examSlug]: number }));
  }

  function submit() {
    if (!question) return;
    if (selected.length === 0) {
      setSubmitError("선지를 하나 이상 선택하세요.");
      return;
    }
    const correctness = score(selected, question.answerKey);
    results.saveResult({
      examSlug,
      number: question.number,
      selected,
      submittedAt: new Date().toISOString(),
      correctness,
    });
    setSubmitted(true);
    setSubmitError("");
  }

  function retryCurrentQuestion() {
    if (!question) return;
    results.clearResult(examSlug, question.number);
    setSelected([]);
    setSubmitted(false);
    setSubmitError("");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <SideMenu
        numbers={numbers}
        current={validNumber}
        statuses={statuses}
        favorites={favorites.favorites}
        examSlug={examSlug}
        onSelect={goTo}
      />
      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
          {isEphemeral ? (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              이 탭 동안만 유지돼요.
            </p>
          ) : null}

          <div
            role="group"
            aria-label="문제 상단 컨트롤"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <Link to="/" className={ghostButton}>
              홈으로
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={index <= 0}
                onClick={() => goTo(numbers[index - 1])}
                className={ghostButton}
              >
                이전
              </button>
              <button
                type="button"
                disabled={index === -1 || index >= numbers.length - 1}
                onClick={() => goTo(numbers[index + 1])}
                className={ghostButton}
              >
                다음
              </button>
            </div>
          </div>

          <article className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <header className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-semibold text-zinc-900">
                문제 <span className="font-mono">{question.number}</span>
              </h1>
              <FavoriteToggle
                active={favorites.isFavorite(examSlug, question.number)}
                onToggle={() => favorites.toggleFavorite(examSlug, question.number)}
              />
            </header>
            <p className="text-lg leading-relaxed text-zinc-800">{question.text}</p>
            <ChoiceList
              choices={question.choices}
              answerKey={question.answerKey}
              selected={selected}
              submitted={submitted}
              onChange={setSelected}
            />
            {submitError ? <p className="text-sm text-rose-700">{submitError}</p> : null}
          </article>

          <div
            role="group"
            aria-label="문제 하단 컨트롤"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <button type="button" onClick={() => setPickerOpen(true)} className={ghostButton}>
              문제집에 추가
            </button>
            <div className="flex gap-2">
              {submitted ? (
                <button type="button" onClick={retryCurrentQuestion} className={ghostButton}>
                  다시 풀기
                </button>
              ) : (
                <button type="button" onClick={submit} className={primaryButton}>
                  제출
                </button>
              )}
            </div>
          </div>

          <ResultFeedback question={question} selected={selected} submitted={submitted} />
        </div>
      </main>

      {pickerOpen ? (
        <QuestionSetPicker
          sets={sets.sets}
          onAdd={(name) => sets.addToSet(name, { examSlug, number: question.number })}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
