import { useState } from "react";

import type { QuestionSet } from "../hooks/useQuestionSets";

type Props = {
  sets: QuestionSet[];
  onAdd: (name: string) => void;
  onClose: () => void;
};

export function QuestionSetPicker({ sets, onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

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
    <div role="dialog" aria-modal="true" aria-label="문제집 추가" className="rounded border p-4">
      <div className="space-y-2">
        {sets.map((set) => (
          <button key={set.id} type="button" onClick={() => submit(set.name)}>
            {set.name}
          </button>
        ))}
      </div>
      <label className="mt-3 block">
        문제집 이름
        <input className="ml-2 border" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {error ? <p className="text-rose-700">{error}</p> : null}
      <button type="button" onClick={() => submit(name)}>
        추가
      </button>
      <button type="button" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}

