import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchQuestion, fetchQuestionNumbers } from "../api/client";
import { ChoiceList } from "../components/ChoiceList";
import { FavoriteToggle } from "../components/FavoriteToggle";
import { QuestionSetPicker } from "../components/QuestionSetPicker";
import { ResultFeedback } from "../components/ResultFeedback";
import { SideMenu } from "../components/SideMenu";
import { ApiError } from "../lib/error";
import { useFavorites } from "../hooks/useFavorites";
import { useLocalSession } from "../hooks/useLocalSession";
import { score, usePerQuestionResult } from "../hooks/usePerQuestionResult";
import { useQuestionSets } from "../hooks/useQuestionSets";

export function PracticePage() {
  const params = useParams();
  const navigate = useNavigate();
  const examSlug = params.examSlug ?? "sap-c02";
  const currentNumber = Number(params.n);
  const validNumber = Number.isFinite(currentNumber) && currentNumber > 0 ? currentNumber : 1;
  const { sessionId, isEphemeral } = useLocalSession();
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
  });

  const answered = useMemo(
    () =>
      new Set(
        Object.values(results.results)
          .filter((result) => result.examSlug === examSlug && result.submittedAt)
          .map((result) => result.number),
      ),
    [examSlug, results.results],
  );

  const question = questionQuery.data;
  const numbers = numbersQuery.data?.numbers ?? [];
  const index = numbers.indexOf(validNumber);
  const error = questionQuery.error ?? numbersQuery.error;

  if (error) {
    const message = error instanceof ApiError ? error.envelope.message : "문제를 불러오지 못했습니다.";
    return (
      <main className="p-6">
        <p className="text-rose-700">{message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </main>
    );
  }

  if (!question) {
    return <main className="p-6">불러오는 중</main>;
  }

  function goTo(number: number) {
    setSelected([]);
    setSubmitted(false);
    setSubmitError("");
    navigate(`/${examSlug}/practice/${number}`);
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

  return (
    <main className="grid min-h-screen grid-cols-[280px_1fr] bg-white text-zinc-950">
      <SideMenu
        numbers={numbers}
        current={validNumber}
        answered={answered}
        favorites={favorites.favorites}
        examSlug={examSlug}
        onSelect={goTo}
      />
      <section className="space-y-5 p-6">
        {isEphemeral ? <p className="text-amber-700">이 탭 동안만 유지돼요.</p> : null}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">문제 {question.number}</h1>
          <FavoriteToggle
            active={favorites.isFavorite(examSlug, question.number)}
            onToggle={() => favorites.toggleFavorite(examSlug, question.number)}
          />
        </div>
        <p>{question.text}</p>
        <ChoiceList
          choices={question.choices}
          answerKey={question.answerKey}
          selected={selected}
          submitted={submitted}
          onChange={setSelected}
        />
        {submitError ? <p className="text-rose-700">{submitError}</p> : null}
        <div className="flex gap-2">
          <button type="button" disabled={index <= 0} onClick={() => goTo(numbers[index - 1])}>
            이전
          </button>
          <button type="button" onClick={submit}>
            제출
          </button>
          <button
            type="button"
            disabled={index === -1 || index >= numbers.length - 1}
            onClick={() => goTo(numbers[index + 1])}
          >
            다음
          </button>
          <button type="button" onClick={() => setPickerOpen(true)}>
            문제집에 추가
          </button>
        </div>
        <ResultFeedback question={question} selected={selected} submitted={submitted} />
        {pickerOpen ? (
          <QuestionSetPicker
            sets={sets.sets}
            onAdd={(name) => sets.addToSet(name, { examSlug, number: question.number })}
            onClose={() => setPickerOpen(false)}
          />
        ) : null}
      </section>
    </main>
  );
}

