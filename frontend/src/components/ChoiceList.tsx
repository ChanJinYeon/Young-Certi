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

  return (
    <fieldset className="space-y-2" aria-label="선지">
      {choices.map((choice) => {
        const checked = selected.includes(choice.label);
        return (
          <label key={choice.label} className="flex gap-3 rounded border border-zinc-200 p-3">
            <input
              type={multiple ? "checkbox" : "radio"}
              name="choice"
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
            <span>
              {choice.label}. {choice.text}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

