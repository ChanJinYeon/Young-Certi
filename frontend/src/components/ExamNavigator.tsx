type ExamNavigatorProps = {
  answered: Set<number>;
  current: number;
  numbers: number[];
  onSelect: (number: number) => void;
};

export function ExamNavigator({ answered, current, numbers, onSelect }: ExamNavigatorProps) {
  return (
    <nav aria-label="시험 문제 목록" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {numbers.map((number) => {
          const active = number === current;
          const done = answered.has(number);
          const label = `문제 ${number}${active ? " 현재" : done ? " 응답됨" : " 미응답"}`;
          return (
            <button
              key={number}
              type="button"
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect(number)}
              className={`min-h-11 rounded-md border px-2 font-mono text-sm font-medium transition-colors ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {number}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
