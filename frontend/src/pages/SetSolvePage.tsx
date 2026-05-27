import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { ResultFeedback } from "../components/ResultFeedback";
import { SideMenu } from "../components/SideMenu";
import { useLocalSession } from "../hooks/useLocalSession";
import { useQuestionSets } from "../hooks/useQuestionSets";
import { useSetResults } from "../hooks/useSetResults";
import { score, type Correctness } from "../hooks/usePerQuestionResult";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50";
const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-800";

export function SetSolvePage() {
  const params = useParams();
  const examSlug = params.examSlug ?? "sap-c02";
  const setId = params.setId ?? "";
  const { sessionId } = useLocalSession();
  const questionSets = useQuestionSets(sessionId);
  const setResults = useSetResults(sessionId, setId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const set = questionSets.sets.find((item) => item.id === setId);
  const refs = useMemo(
    () => set?.questionRefs.filter((ref) => ref.examSlug === examSlug) ?? [],
    [examSlug, set?.questionRefs],
  );
  const currentRef = refs[currentIndex] ?? refs[0];
  const currentSavedResult = currentRef ? setResults.getResult(currentRef.number) : undefined;

  const numbersQuery = useQuery({
    queryKey: ["question-numbers", examSlug],
    queryFn: () => fetchQuestionNumbers(examSlug),
    enabled: Boolean(set),
  });
  const availableNumbers = useMemo(() => new Set(numbersQuery.data?.numbers ?? []), [numbersQuery.data?.numbers]);
  const currentAvailable = Boolean(currentRef && availableNumbers.has(currentRef.number));
  const questionQuery = useQuery({
    queryKey: ["set-question", examSlug, currentRef?.number],
    queryFn: () => fetchQuestion(examSlug, currentRef?.number ?? 0),
    enabled: Boolean(currentRef && currentAvailable),
    placeholderData: keepPreviousData,
  });

  const statuses = useMemo<Record<number, Correctness | "answered" | null>>(() => {
    const map: Record<number, Correctness | "answered" | null> = {};
    refs.forEach((ref, index) => {
      if (numbersQuery.data && !availableNumbers.has(ref.number)) {
        map[index + 1] = "answered";
        return;
      }
      map[index + 1] = setResults.results[ref.number]?.correctness ?? null;
    });
    return map;
  }, [availableNumbers, numbersQuery.data, refs, setResults.results]);

  useEffect(() => {
    if (currentIndex >= refs.length) {
      setCurrentIndex(Math.max(0, refs.length - 1));
    }
  }, [currentIndex, refs.length]);

  useEffect(() => {
    if (!currentRef) return;
    setSelected(currentSavedResult?.selected ?? []);
    setSubmitted(Boolean(currentSavedResult?.submittedAt));
    setSubmitError("");
  }, [currentRef, currentSavedResult]);

  useEffect(() => {
    if (!removeOpen) return;
    const buttons = dialogRef.current?.querySelectorAll("button");
    buttons?.[0]?.focus();
  }, [removeOpen]);

  function goTo(position: number) {
    setCurrentIndex(Math.max(0, Math.min(refs.length - 1, position - 1)));
  }

  function submit() {
    const question = questionQuery.data;
    if (!currentRef || !question) return;
    if (selected.length === 0) {
      setSubmitError("선지를 하나 이상 선택하세요.");
      return;
    }
    setResults.saveResult({
      examSlug,
      number: currentRef.number,
      selected,
      submittedAt: new Date().toISOString(),
      correctness: score(selected, question.answerKey),
    });
    setSubmitted(true);
    setSubmitError("");
  }

  function retryCurrentQuestion() {
    if (!currentRef) return;
    setResults.clearResult(currentRef.number);
    setSelected([]);
    setSubmitted(false);
    setSubmitError("");
  }

  function removeCurrentQuestion() {
    if (!currentRef) return;
    questionSets.removeQuestion(setId, currentRef);
    setRemoveOpen(false);
  }

  function trapRemoveDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setRemoveOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!set) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
          <Link to={`/${examSlug}/sets`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            문제집 목록으로
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950">문제집을 찾을 수 없습니다</h1>
        </div>
      </main>
    );
  }

  if (refs.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
          <Link to={`/${examSlug}/sets`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
            문제집 목록으로
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950">{set.name}</h1>
          <p className="rounded-lg border border-zinc-200 bg-white p-5 text-zinc-600 shadow-sm">
            이 문제집에는 아직 문항이 없습니다.
          </p>
        </div>
      </main>
    );
  }

  const question = questionQuery.data;

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
      <SideMenu
        numbers={refs.map((_, index) => index + 1)}
        current={currentIndex + 1}
        statuses={statuses}
        navLabel="세트 문제 목록"
        mobileLabel="세트 문제 목록"
        getHref={(position) => `/${examSlug}/sets/${setId}#${position}`}
        getLabel={(position) => String(position)}
        getAriaLabel={(position, active, status) => {
          const label = status === "answered" ? "사용 불가" : status ? "응답됨" : "미응답";
          return `세트 문제 ${position}${active ? " 현재" : ""} ${label}`;
        }}
        onSelect={goTo}
      />
      <div className="flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <Link to={`/${examSlug}/sets`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
                문제집 목록으로
              </Link>
              <h1 className="text-3xl font-semibold text-zinc-950">{set.name}</h1>
              <p className="font-mono text-sm text-zinc-600">
                {currentIndex + 1}/{refs.length}
              </p>
            </div>
            <button type="button" className={ghostButton} onClick={() => setRemoveOpen(true)}>
              세트에서 제거
            </button>
          </header>

          <div
            role="group"
            aria-label="세트 상단 컨트롤"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <Link to={`/${examSlug}/`} className={ghostButton}>
              홈으로
            </Link>
            <div className="flex gap-2">
              <button type="button" disabled={currentIndex <= 0} onClick={() => goTo(currentIndex)} className={ghostButton}>
                이전
              </button>
              <button
                type="button"
                disabled={currentIndex >= refs.length - 1}
                onClick={() => goTo(currentIndex + 2)}
                className={ghostButton}
              >
                다음
              </button>
            </div>
          </div>

          {numbersQuery.data && !currentAvailable ? (
            <article className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">문항 {currentRef.number}</h2>
              <p className="text-zinc-600">이 문항은 현재 문제 풀에 없습니다.</p>
            </article>
          ) : question ? (
            <article className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <header className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  문제 <span className="font-mono">{question.number}</span>
                </h2>
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
          ) : (
            <p className="text-zinc-500">문제를 불러오는 중...</p>
          )}

          <div
            role="group"
            aria-label="세트 하단 컨트롤"
            className="flex flex-wrap items-center justify-end gap-2"
          >
            {submitted ? (
              <button type="button" onClick={retryCurrentQuestion} className={ghostButton}>
                다시 풀기
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={!question || !currentAvailable} className={primaryButton}>
                제출
              </button>
            )}
          </div>

          {question ? <ResultFeedback question={question} selected={selected} submitted={submitted} /> : null}
        </div>
      </div>

      {removeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
          onClick={() => setRemoveOpen(false)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="세트 문항 제거 확인"
            onKeyDown={trapRemoveDialogFocus}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-zinc-900">이 문항을 세트에서 제거할까요?</h2>
            <p className="text-sm leading-relaxed text-zinc-600">문제집에서만 빠지고 원본 문제 풀은 유지됩니다.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setRemoveOpen(false)}>
                취소
              </button>
              <button type="button" className={dangerButton} onClick={removeCurrentQuestion}>
                제거
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
