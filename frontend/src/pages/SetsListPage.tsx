import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { PageHeader } from "../components/PageHeader";
import { useLocalSession } from "../hooks/useLocalSession";
import { type QuestionSet, useQuestionSets } from "../hooks/useQuestionSets";

const ghostButton =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800";
const primaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800";
const dangerButton =
  "inline-flex min-h-11 items-center justify-center rounded-md bg-rose-700 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-800";

type VisibleSet = QuestionSet & {
  scopedCount: number;
};

export function SetsListPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";
  const { sessionId } = useLocalSession();
  const questionSets = useQuestionSets(sessionId);
  const [pendingDelete, setPendingDelete] = useState<VisibleSet | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [createError, setCreateError] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const visibleSets = useMemo<VisibleSet[]>(
    () =>
      questionSets.sets
        .map((set) => ({
          ...set,
          scopedCount: set.questionRefs.filter((ref) => ref.examSlug === examSlug).length,
        }))
        .filter((set) => set.scopedCount > 0 || set.questionRefs.length === 0),
    [examSlug, questionSets.sets],
  );

  useEffect(() => {
    if (!pendingDelete) return;
    const buttons = dialogRef.current?.querySelectorAll("button");
    buttons?.[0]?.focus();
  }, [pendingDelete]);

  function trapDeleteDialogFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      setPendingDelete(null);
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

  function deletePendingSet() {
    if (!pendingDelete) return;
    questionSets.deleteSet(pendingDelete.id);
    setPendingDelete(null);
  }

  function createSet() {
    const result = questionSets.createSet(newSetName);
    if ("error" in result) {
      setCreateError(result.error === "blank" ? "문제집 이름을 입력하세요." : "이미 같은 이름의 문제집이 있습니다.");
      return;
    }
    setNewSetName("");
    setCreateError("");
    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-12">
        <PageHeader
          backTo={`/${examSlug}/`}
          backLabel="학습 모드로 돌아가기"
          eyebrow="AWS SAP-C02"
          title="문제집"
          description="저장해 둔 문제 묶음을 열어 필요한 범위만 다시 풉니다."
        />

        <section aria-label="문제집 추가" className="space-y-3">
          {creating ? (
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <label className="block space-y-1 text-sm font-medium text-zinc-700">
                <span>문제집 이름</span>
                <input
                  value={newSetName}
                  onChange={(event) => {
                    setNewSetName(event.currentTarget.value);
                    setCreateError("");
                  }}
                  className="min-h-11 w-full rounded-md border border-zinc-300 px-3 text-base text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </label>
              {createError ? <p className="text-sm text-rose-700">{createError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primaryButton} onClick={createSet}>
                  확인
                </button>
                <button
                  type="button"
                  className={ghostButton}
                  onClick={() => {
                    setCreating(false);
                    setNewSetName("");
                    setCreateError("");
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={primaryButton} onClick={() => setCreating(true)}>
              문제집 추가
            </button>
          )}
        </section>

        {visibleSets.length === 0 ? (
          <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-900">아직 문제집이 없습니다</h2>
              <p className="leading-relaxed text-zinc-600">
                문제 풀이 화면에서 문제를 열고 "문제집에 추가"를 사용하면 여기에 표시됩니다.
              </p>
            </div>
            <Link to={`/${examSlug}/practice`} className={primaryLink}>
              문제 풀이로 이동
            </Link>
          </section>
        ) : (
          <section aria-label="저장된 문제집" className="grid gap-3">
            {visibleSets.map((set) => (
              <article
                key={set.id}
                aria-label={`${set.name} 문제집`}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h2 className="break-words text-lg font-semibold text-zinc-900">{set.name}</h2>
                    {set.scopedCount === 0 ? (
                      <span
                        aria-label="문제 0개"
                        className="inline-flex rounded-md bg-amber-50 px-2 py-1 font-mono text-sm text-amber-700"
                      >
                        0문항
                      </span>
                    ) : (
                      <p className="font-mono text-sm text-zinc-600">{set.scopedCount}문항</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/${examSlug}/sets/${set.id}`} aria-label={`${set.name} 열기`} className={primaryLink}>
                      열기
                    </Link>
                    <button
                      type="button"
                      className={ghostButton}
                      aria-label={`${set.name} 삭제`}
                      onClick={() => setPendingDelete(set)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="문제집 삭제 확인"
            onKeyDown={trapDeleteDialogFocus}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-zinc-900">문제집을 삭제할까요?</h2>
            <p className="text-sm leading-relaxed text-zinc-600">
              "{pendingDelete.name}" 문제집과 이 문제집의 풀이 기록이 삭제됩니다. 다른 문제집은 유지됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className={ghostButton} onClick={() => setPendingDelete(null)}>
                취소
              </button>
              <button type="button" className={dangerButton} onClick={deletePendingSet}>
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
