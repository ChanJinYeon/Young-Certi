import { useEffect, useRef, useState } from "react";

import type { QuestionSet } from "../hooks/useQuestionSets";

type Props = {
  sets: QuestionSet[];
  onAdd: (name: string) => void;
  onClose: () => void;
};

export function QuestionSetPicker({ sets, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href],button,input,[tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      trigger?.focus?.();
    };
  }, [onClose]);

  function submit(nextName: string) {
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError("문제집 이름을 입력하세요.");
      return;
    }
    onAdd(trimmed);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="문제집 추가"
        className="flex max-h-full w-full max-w-[480px] flex-col gap-4 rounded-xl bg-white p-5 shadow-xl max-sm:h-full max-sm:rounded-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">문제집에 추가</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
          >
            닫기
          </button>
        </div>

        {sets.length > 0 ? (
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {sets.map((set) => (
              <li key={set.id}>
                <button
                  type="button"
                  onClick={() => submit(set.name)}
                  className="flex min-h-11 w-full items-center justify-between rounded-md border border-zinc-200 px-3 text-left text-sm hover:bg-zinc-50"
                >
                  <span className="truncate text-zinc-800">{set.name}</span>
                  <span className="ml-2 shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600">
                    {set.questionRefs.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">아직 만든 문제집이 없어요. 새로 만들어보세요.</p>
        )}

        <div className="space-y-2 border-t border-zinc-200 pt-4">
          <label className="block text-sm font-medium text-zinc-700">
            문제집 이름
            <input
              ref={inputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit(name);
              }}
              placeholder="새 문제집 만들기"
              className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </label>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          <button
            type="button"
            onClick={() => submit(name)}
            className="min-h-11 w-full rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
