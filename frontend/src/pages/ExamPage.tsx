import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { ExamResult } from "../components/ExamResult";
import { ExamTimer } from "../components/ExamTimer";
import { SideMenu } from "../components/SideMenu";
import { useExamAttempt } from "../hooks/useExamAttempt";
import { useLocalSession } from "../hooks/useLocalSession";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50";

export function ExamPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const navigate = useNavigate();
  const { sessionId } = useLocalSession();
  const examAttempt = useExamAttempt(sessionId, examSlug);
  const [extraTime, setExtraTime] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitDialogRef = useRef<HTMLDivElement | null>(null);
  const homeDialogRef = useRef<HTMLDivElement | null>(null);

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

  function resetAndGoHome() {
    examAttempt.reset();
    setHomeOpen(false);
    navigate("/");
  }

  if (attempt?.status === "submitted") {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
          {resultQuestionsQuery.data ? (
            <ExamResult attempt={attempt} questions={resultQuestionsQuery.data} />
          ) : (
            <p className="text-zinc-500">결과를 불러오는 중...</p>
          )}
        </div>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 lg:py-12">
          <p className="text-sm font-medium text-zinc-500">AWS SAP-C02</p>
          <h1 className="text-3xl font-semibold text-zinc-950">시험 모드</h1>
          <p className="leading-relaxed text-zinc-600">
            75문항을 무작위로 선택해 제한 시간 안에 풀이합니다. 시험 중에는 정답과 해설을 표시하지 않습니다.
          </p>
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
    <main className="flex min-h-screen flex-col bg-zinc-50 lg:flex-row">
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
      <div className="flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 sm:px-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-500">AWS SAP-C02</p>
              <h1 className="text-3xl font-semibold text-zinc-950">문제 {currentIndex + 1}</h1>
            </div>
            <ExamTimer remainingSeconds={remainingSeconds} />
          </header>

          <div
            role="group"
            aria-label="시험 상단 컨트롤"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <button type="button" className={ghostButton} onClick={() => setHomeOpen(true)}>
              홈으로
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className={ghostButton}
                disabled={currentIndex <= 0}
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              >
                이전
              </button>
              <button
                type="button"
                className={ghostButton}
                disabled={currentIndex >= attempt.questionNumbers.length - 1}
                onClick={() => setCurrentIndex((index) => Math.min(attempt.questionNumbers.length - 1, index + 1))}
              >
                다음
              </button>
            </div>
          </div>

          {question ? (
            <article className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
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
      </div>

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
            <h2 className="text-lg font-semibold text-zinc-900">홈으로 가면 시험이 초기화됩니다</h2>
            <p className="text-sm text-zinc-600">진행 중인 답안과 남은 시간이 삭제됩니다. 계속할까요?</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setHomeOpen(false)}>
                취소
              </button>
              <button type="button" className={primaryButton} onClick={resetAndGoHome}>
                초기화하고 홈으로
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
