import { Check, X } from "lucide-react";

import type { Choice } from "../api/types";

type Props = {
  choices: Choice[];
  answerKey: string[];
  selected: string[];
  submitted: boolean;
  onChange: (selected: string[]) => void;
};

export function ChoiceList({ choices, answerKey, selected, submitted, onChange }: Props) {
  const multiple = answerKey.length > 1;
  const answerSet = new Set(answerKey);

  return (
    <fieldset className="space-y-2" aria-label="선지">
      {choices.map((choice) => {
        const checked = selected.includes(choice.label);
        const correct = answerSet.has(choice.label);

        let stateClass = "border-zinc-200 hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-50";
        if (submitted) {
          if (correct) stateClass = "border-emerald-200 bg-emerald-50 text-emerald-900";
          else if (checked) stateClass = "border-rose-200 bg-rose-50 text-rose-900";
          else stateClass = "border-zinc-200 text-zinc-500";
        }

        return (
          <label
            key={choice.label}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-base transition-colors ${stateClass} ${
              submitted ? "cursor-default" : ""
            }`}
          >
            <input
              type={multiple ? "checkbox" : "radio"}
              name="choice"
              className="h-5 w-5 shrink-0 accent-zinc-900"
              checked={checked}
              disabled={submitted}
              onChange={() => {
                if (multiple) {
                  onChange(
                    checked
                      ? selected.filter((label) => label !== choice.label)
                      : [...selected, choice.label],
                  );
                } else {
                  onChange([choice.label]);
                }
              }}
            />
            <span className="flex-1">
              {choice.label}. {choice.text}
            </span>
            {submitted && correct ? <Check aria-hidden size={18} className="shrink-0 text-emerald-600" /> : null}
            {submitted && checked && !correct ? <X aria-hidden size={18} className="shrink-0 text-rose-600" /> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
