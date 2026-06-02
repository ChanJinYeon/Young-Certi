import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { Pager } from "../components/Pager";
import { PageHeader } from "../components/PageHeader";
import { ResultFeedback } from "../components/ResultFeedback";
import { SideMenu } from "../components/SideMenu";
import { StudyTwoPane } from "../components/StudyTwoPane";
import { useLocalSession } from "../hooks/useLocalSession";
import { getSortedRefs, useQuestionSets, type QuestionSetSortMode } from "../hooks/useQuestionSets";
import { useSetResults } from "../hooks/useSetResults";
import { score, type Correctness } from "../hooks/usePerQuestionResult";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50";
const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-800";
const primaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800";
const topBarButton =
  "inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export function SetSolvePage() {
  const params = useParams();
  const navigate = useNavigate();
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
  const [sortOpen, setSortOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const set = questionSets.sets.find((item) => item.id === setId);
  const setsBack = {
    backTo: `/${examSlug}/sets`,
    backLabel: "이전",
  };
  const refs = useMemo(
    () => (set ? getSortedRefs(set).filter((ref) => ref.examSlug === examSlug) : []),
    [examSlug, set],
  );
  const currentRef = refs[currentIndex] ?? refs[0];
  const currentSavedResult = currentRef ? setResults.getResult(currentRef.number) : undefined;
  const sortMode = set?.sortMode ?? "added";

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
    refs.forEach((ref) => {
      if (numbersQuery.data && !availableNumbers.has(ref.number)) {
        map[ref.number] = "answered";
        return;
      }
      map[ref.number] = setResults.results[ref.number]?.correctness ?? null;
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

  function goTo(number: number) {
    const nextIndex = refs.findIndex((ref) => ref.number === number);
    setCurrentIndex(nextIndex === -1 ? 0 : nextIndex);
  }

  function setSortMode(mode: QuestionSetSortMode) {
    questionSets.setSortMode(setId, mode);
    setCurrentIndex(0);
    setSortOpen(false);
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
          <PageHeader
            {...setsBack}
            eyebrow="AWS SAP-C02"
            title="문제집을 찾을 수 없습니다"
          />
        </div>
      </main>
    );
  }

  if (refs.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
          <PageHeader
            {...setsBack}
            eyebrow="AWS SAP-C02"
            title={set.name}
            description="저장한 문제 묶음을 다시 풀고 결과를 세트별로 확인합니다."
          />
          <p className="rounded-lg border border-zinc-200 bg-white p-5 text-zinc-600 shadow-sm">
            이 문제집에는 아직 문항이 없습니다.
          </p>
          <Link to={`/${examSlug}/sets`} className={primaryLink}>
            문제집 목록으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const question = questionQuery.data;

  return (
    <main className="min-h-screen bg-zinc-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <StudyTwoPane
        topBar={
          <div className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 lg:grid-cols-[1fr_auto_1fr] lg:gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="이전 화면으로" className={topBarButton} onClick={() => navigate(-1)}>
                <span aria-hidden>←</span>
                <span className="hidden lg:inline">{setsBack.backLabel}</span>
              </button>
              <h1 className="hidden truncate text-lg font-semibold text-zinc-950 lg:block">{set.name}</h1>
            </div>
            <Pager
              current={currentIndex + 1}
              total={refs.length}
              prevDisabled={currentIndex <= 0}
              nextDisabled={currentIndex >= refs.length - 1}
              onPrev={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              onNext={() => setCurrentIndex((index) => Math.min(refs.length - 1, index + 1))}
            />
            <div className="relative flex min-w-0 items-center justify-end">
              <button
                type="button"
                aria-label={`정렬: ${sortMode === "number" ? "문제 번호 순" : "추가한 순서"}`}
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                className={topBarButton}
                onClick={() => setSortOpen((open) => !open)}
              >
                정렬
              </button>
              {sortOpen ? (
                <div
                  role="menu"
                  aria-label="문제집 정렬"
                  className="absolute right-0 top-10 z-50 w-36 overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                    onClick={() => setSortMode("number")}
                  >
                    문제 번호 순
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                    onClick={() => setSortMode("added")}
                  >
                    추가한 순서
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        }
        sidebar={
          <div data-testid="set-solve-sidebar-shell" className="bg-white lg:min-h-[calc(100vh-3.5rem)]">
            <SideMenu
              numbers={refs.map((ref) => ref.number)}
              current={currentRef.number}
              statuses={statuses}
              navLabel="세트 문제 목록"
              mobileLabel="세트 문제 목록"
              getHref={(number) => `/${examSlug}/sets/${setId}#${number}`}
              getAriaLabel={(number, active, status) => {
                const label = status === "answered" ? "사용 불가" : status ? "응답됨" : "미응답";
                return `세트 문제 ${number}${active ? " 현재" : ""} ${label}`;
              }}
              onSelect={goTo}
            />
          </div>
        }
      >
          <div
            data-testid="set-solve-study-content"
            className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-6 pt-4 sm:px-6 xl:-translate-x-[7.5rem]"
          >
            {numbersQuery.data && !currentAvailable ? (
              <article className="space-y-3 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900">문제 {currentRef.number}</h2>
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
              <button type="button" className={ghostButton} onClick={() => setRemoveOpen(true)}>
                제거
              </button>
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
      </StudyTwoPane>

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
