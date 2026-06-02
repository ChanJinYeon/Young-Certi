import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { ExamResult } from "../components/ExamResult";
import { ExamTimer } from "../components/ExamTimer";
import { Pager } from "../components/Pager";
import { PageHeader } from "../components/PageHeader";
import { QuestionSetPicker } from "../components/QuestionSetPicker";
import { SideMenu } from "../components/SideMenu";
import { StudyTwoPane } from "../components/StudyTwoPane";
import { Toast } from "../components/Toast";
import { useExamAttempt } from "../hooks/useExamAttempt";
import { useLocalSession } from "../hooks/useLocalSession";
import { score as gradeChoice, type Correctness } from "../hooks/usePerQuestionResult";
import { useQuestionSets, type QuestionRef } from "../hooks/useQuestionSets";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50";
const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700";
const topBarLink =
  "inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export function ExamPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const navigate = useNavigate();
  const { sessionId } = useLocalSession();
  const examAttempt = useExamAttempt(sessionId, examSlug);
  const questionSets = useQuestionSets(sessionId);
  const [extraTime, setExtraTime] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [pickerRef, setPickerRef] = useState<QuestionRef | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const submitDialogRef = useRef<HTMLDivElement | null>(null);
  const homeDialogRef = useRef<HTMLDivElement | null>(null);
  const retryDialogRef = useRef<HTMLDivElement | null>(null);

  const numbersQuery = useQuery({
    queryKey: ["question-numbers", examSlug],
    queryFn: () => fetchQuestionNumbers(examSlug),
  });

  const attempt = examAttempt.attempt;
  const currentNumber = attempt?.questionNumbers[currentIndex] ?? attempt?.questionNumbers[0] ?? 1;
  const questionQuery = useQuery({
    queryKey: ["exam-question", examSlug, currentNumber],
    queryFn: () => fetchQuestion(examSlug, currentNumber),
    enabled: Boolean(attempt && attempt.status === "in-progress"),
  });
  const resultQuestionsQuery = useQuery({
    queryKey: ["exam-result-questions", examSlug, attempt?.questionNumbers],
    queryFn: () => Promise.all((attempt?.questionNumbers ?? []).map((number) => fetchQuestion(examSlug, number))),
    enabled: Boolean(attempt && attempt.status === "submitted"),
  });
  const examPositions = useMemo(
    () => attempt?.questionNumbers.map((_, index) => index + 1) ?? [],
    [attempt?.questionNumbers],
  );
  const positionStatuses = useMemo<Record<number, "answered" | null>>(() => {
    const map: Record<number, "answered" | null> = {};
    attempt?.questionNumbers.forEach((number, index) => {
      map[index + 1] = attempt.answers[number]?.length ? "answered" : null;
    });
    return map;
  }, [attempt?.answers, attempt?.questionNumbers]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in-progress") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  const remainingSeconds = useMemo(() => {
    if (!attempt || attempt.status === "submitted") return 0;
    const endsAt = new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000;
    return Math.max(0, Math.ceil((endsAt - now) / 1000));
  }, [attempt, now]);

  const submitExam = useCallback(async () => {
    if (!attempt) return;
    const questions = await Promise.all(attempt.questionNumbers.map((number) => fetchQuestion(examSlug, number)));
    examAttempt.submit(questions);
    setResultIndex(0);
    setSubmitOpen(false);
  }, [attempt, examAttempt, examSlug]);

  useEffect(() => {
    if (attempt?.status === "in-progress" && remainingSeconds === 0) {
      void submitExam();
    }
  }, [attempt?.status, remainingSeconds, submitExam]);

  useEffect(() => {
    if (!submitOpen) return;
    const buttons = submitDialogRef.current?.querySelectorAll("button");
    buttons?.[0]?.focus();
  }, [submitOpen]);

  useEffect(() => {
    if (!homeOpen) return;
    const buttons = homeDialogRef.current?.querySelectorAll("button");
    buttons?.[0]?.focus();
  }, [homeOpen]);

  useEffect(() => {
    if (!retryOpen) return;
    const buttons = retryDialogRef.current?.querySelectorAll("button");
    buttons?.[0]?.focus();
  }, [retryOpen]);

  function trapSubmitDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setSubmitOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(submitDialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
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

  function trapHomeDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setHomeOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(homeDialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
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

  function trapRetryDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setRetryOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(retryDialogRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
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

  function resetAndGoBack() {
    examAttempt.reset();
    setHomeOpen(false);
    navigate(-1);
  }

  useEffect(() => {
    if (attempt?.status !== "submitted") return;
    const lastIndex = Math.max(0, attempt.questionNumbers.length - 1);
    setResultIndex((index) => Math.min(Math.max(0, index), lastIndex));
  }, [attempt?.questionNumbers.length, attempt?.status]);

  if (attempt?.status === "submitted") {
    const resultQuestions = resultQuestionsQuery.data ?? [];
    const resultItems = attempt.questionNumbers.map((number, index) => {
      const question = resultQuestions.find((item) => item.number === number);
      const correctness = question ? gradeChoice(attempt.answers[question.number] ?? [], question.answerKey) : null;
      return { displayNumber: index + 1, number, question, correctness };
    });
    const resultStatuses: Record<number, Correctness> = {};
    for (const item of resultItems) {
      resultStatuses[item.displayNumber] = item.correctness ?? "incorrect";
    }
    const score = attempt.score ?? { correct: 0, total: attempt.questionNumbers.length, percent: 0, pass: false };
    const resultNumber = attempt.questionNumbers[resultIndex] ?? attempt.questionNumbers[0] ?? 0;
    const resultQuestion = resultQuestions.find((question) => question.number === resultNumber);
    const resultCorrectness = resultQuestion
      ? gradeChoice(attempt.answers[resultQuestion.number] ?? [], resultQuestion.answerKey)
      : null;
    const resultBadgeClass = score.pass
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-zinc-300 bg-zinc-100 text-zinc-700";

    function addCurrentResultToSet(name: string) {
      if (!pickerRef) return;
      questionSets.addToSet(name, pickerRef);
      setToast({ message: "문제집에 추가했습니다.", tone: "success" });
    }

    function retryExam() {
      examAttempt.reset();
      setResultIndex(0);
      setRetryOpen(false);
    }

    return (
      <main className="min-h-screen bg-zinc-50">
        <StudyTwoPane
          topBar={
            <div className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 lg:grid-cols-[1fr_auto_1fr] lg:gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  type="button"
                  aria-label="이전 화면으로"
                  className={topBarLink}
                  onClick={() => navigate(-1)}
                >
                  <span aria-hidden>←</span>
                  <span className="hidden lg:inline">이전</span>
                </button>
                <span className="hidden truncate text-sm font-semibold text-zinc-900">
                  시험 결과 · {score.percent}%
                </span>
                <div className="hidden min-w-0 items-center gap-3 lg:flex">
                  <h1 className="text-lg font-semibold text-zinc-950">시험 결과</h1>
                  <span className="font-mono text-sm font-semibold text-zinc-700">
                    {score.correct} / {score.total}
                  </span>
                  <span className="font-mono text-sm font-semibold text-zinc-700">{score.percent}%</span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${resultBadgeClass}`}>
                    {score.pass ? "합격" : "불합격"}
                  </span>
                </div>
              </div>
              <Pager
                ariaLabel="시험 결과 상단 컨트롤"
                current={resultIndex + 1}
                total={attempt.questionNumbers.length}
                prevDisabled={resultIndex <= 0}
                nextDisabled={resultIndex >= attempt.questionNumbers.length - 1}
                onPrev={() => setResultIndex((index) => Math.max(0, index - 1))}
                onNext={() => setResultIndex((index) => Math.min(attempt.questionNumbers.length - 1, index + 1))}
              />
              <div className="hidden justify-start lg:flex lg:justify-end">
                <button
                  type="button"
                  className={topBarLink}
                  onClick={() => setRetryOpen(true)}
                >
                  다시 풀기
                </button>
              </div>
            </div>
          }
          sidebar={
            <SideMenu
              numbers={resultItems.map((item) => item.displayNumber)}
              current={resultIndex + 1}
              statuses={resultStatuses}
              navLabel="시험 결과 문제 목록"
              mobileLabel="시험 결과 문제 목록"
              getHref={(number) => `#q-${number}`}
              getAriaLabel={(number, active, status) => {
                const label = status === "correct" ? "정답" : "오답";
                return `시험 결과 문제 ${number}${active ? " 현재" : ""} ${label}`;
              }}
              onSelect={(number) => setResultIndex(Math.max(0, number - 1))}
            />
          }
        >
          <div
            data-testid="exam-result-study-content"
            className="mx-auto w-full max-w-3xl px-4 pb-6 pt-4 sm:px-6 xl:-translate-x-[7.5rem]"
          >
            <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm sm:hidden">
              <span className="text-sm font-medium text-zinc-600">시험 결과</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-zinc-900">
                  {score.correct}/{score.total}
                </span>
                <span className="font-mono text-sm font-semibold text-zinc-900">{score.percent}%</span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${resultBadgeClass}`}>
                  {score.pass ? "합격" : "불합격"}
                </span>
              </div>
            </div>
            {resultQuestion ? (
              <>
                <ExamResult
                  question={resultQuestion}
                  displayNumber={resultIndex + 1}
                  selected={attempt.answers[resultQuestion.number] ?? []}
                  correctness={resultCorrectness ?? "incorrect"}
                />
                <div
                  role="group"
                  aria-label="시험 결과 하단 컨트롤"
                  className="mt-4 flex flex-wrap items-center justify-end gap-2"
                >
                  <button
                    type="button"
                    className={ghostButton}
                    onClick={() => setPickerRef({ examSlug, number: resultQuestion.number })}
                  >
                    문제집에 추가
                  </button>
                </div>
              </>
          ) : (
            <p className="text-zinc-500">결과를 불러오는 중...</p>
          )}
          </div>
        </StudyTwoPane>
        {pickerRef ? (
          <QuestionSetPicker
            sets={questionSets.sets}
            onAdd={addCurrentResultToSet}
            onClose={() => setPickerRef(null)}
          />
        ) : null}
        {retryOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
            onClick={() => setRetryOpen(false)}
          >
            <div
              ref={retryDialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="시험 다시 풀기 확인"
              className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={trapRetryDialogFocus}
            >
              <h2 className="text-lg font-semibold text-zinc-900">시험을 다시 풀까요?</h2>
              <p className="text-sm leading-relaxed text-zinc-600">현재 시험 결과와 답안 기록이 삭제됩니다.</p>
              <div className="flex justify-end gap-2">
                <button type="button" className={ghostButton} onClick={() => setRetryOpen(false)}>
                  취소
                </button>
                <button type="button" className={dangerButton} onClick={retryExam}>
                  다시 풀기 시작
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {toast ? (
          <Toast
            message={toast.message}
            tone={toast.tone}
            onDismiss={() => setToast(null)}
          />
        ) : null}
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 lg:py-12">
          <PageHeader
            backTo="/"
            backLabel="홈으로"
            eyebrow="AWS SAP-C02"
            title="시험 모드"
            description="75문항을 무작위로 선택해 제한 시간 안에 풀이합니다. 시험 중에는 정답과 해설을 표시하지 않습니다."
          />
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-700 shadow-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-zinc-900"
              checked={extraTime}
              onChange={(event) => setExtraTime(event.currentTarget.checked)}
            />
            +30분 추가 시간 사용
          </label>
          <button
            type="button"
            className={primaryButton}
            disabled={!numbersQuery.data}
            onClick={() => numbersQuery.data && examAttempt.start(numbersQuery.data.numbers, { extraTime })}
          >
            시험 시작
          </button>
        </div>
      </main>
    );
  }

  const question = questionQuery.data;
  const selected = attempt.answers[currentNumber] ?? [];

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
              <button
                type="button"
                aria-label="이전 화면으로"
                className={topBarLink}
                onClick={() => setHomeOpen(true)}
              >
                <span aria-hidden>←</span>
                <span className="hidden lg:inline">이전</span>
              </button>
              <h1 className="hidden truncate text-lg font-semibold text-zinc-950 lg:block">시험 모드</h1>
            </div>
            <Pager
              current={currentIndex + 1}
              total={attempt.questionNumbers.length}
              prevDisabled={currentIndex <= 0}
              nextDisabled={currentIndex >= attempt.questionNumbers.length - 1}
              onPrev={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              onNext={() => setCurrentIndex((index) => Math.min(attempt.questionNumbers.length - 1, index + 1))}
            />
            <div className="hidden justify-start lg:flex lg:justify-end">
              <ExamTimer remainingSeconds={remainingSeconds} />
            </div>
          </div>
        }
        sidebar={
          <SideMenu
            numbers={examPositions}
            current={currentIndex + 1}
            statuses={positionStatuses}
            navLabel="시험 위치 목록"
            mobileLabel="시험 위치 목록"
            getHref={(position) => `/${examSlug}/exam#${position}`}
            getAriaLabel={(position, active, status) =>
              `시험 위치 ${position}${active ? " 현재" : ""}${status ? " 응답됨" : " 미응답"}`
            }
            onSelect={(position) => setCurrentIndex(Math.max(0, position - 1))}
          />
        }
      >
          <div
            data-testid="exam-study-content"
            className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-6 pt-4 sm:px-6 xl:-translate-x-[7.5rem]"
          >
            {question ? (
              <article className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  문제 <span className="font-mono">{currentIndex + 1}</span>
                </h2>
                <p className="text-lg leading-relaxed text-zinc-800">{question.text}</p>
                <ChoiceList
                  choices={question.choices}
                  answerKey={question.answerKey}
                  selected={selected}
                  submitted={false}
                  onChange={(next) => examAttempt.answer(question.number, next)}
                />
              </article>
            ) : (
              <p className="text-zinc-500">문제를 불러오는 중...</p>
            )}

            <div
              role="group"
              aria-label="시험 하단 컨트롤"
              className="flex flex-wrap items-center justify-end gap-2"
            >
              <button type="button" className={primaryButton} onClick={() => setSubmitOpen(true)}>
                시험 제출
              </button>
            </div>
          </div>
      </StudyTwoPane>

      {submitOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
          onClick={() => setSubmitOpen(false)}
        >
          <div
            ref={submitDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="시험 제출 확인"
            onKeyDown={trapSubmitDialogFocus}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-zinc-900">시험을 제출하시겠어요?</h2>
            <p className="text-sm text-zinc-600">제출 후에는 시험 결과 화면으로 이동합니다.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setSubmitOpen(false)}>
                취소
              </button>
              <button type="button" className={primaryButton} onClick={() => void submitExam()}>
                제출하기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {homeOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
          onClick={() => setHomeOpen(false)}
        >
          <div
            ref={homeDialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="시험 나가기 확인"
            onKeyDown={trapHomeDialogFocus}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-zinc-900">이전 화면으로 가면 시험이 초기화됩니다</h2>
            <p className="text-sm text-zinc-600">진행 중인 답안과 남은 시간이 삭제됩니다. 계속할까요?</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setHomeOpen(false)}>
                취소
              </button>
              <button type="button" className={dangerButton} onClick={resetAndGoBack}>
                초기화하고 이전으로
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
