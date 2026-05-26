type Props = {
  numbers: number[];
  current: number;
  answered: Set<number>;
  favorites: Set<string>;
  examSlug: string;
  onSelect: (number: number) => void;
};

export function SideMenu({ numbers, current, answered, favorites, examSlug, onSelect }: Props) {
  return (
    <nav aria-label="문제 목록" className="max-h-[70vh] overflow-y-auto border-r border-zinc-200 p-3">
      <div className="grid grid-cols-5 gap-2">
        {numbers.map((number) => (
          <button
            key={number}
            type="button"
            aria-label={`문제 ${number}`}
            className={`relative rounded border px-2 py-2 text-sm ${
              number === current ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200"
            }`}
            onClick={() => onSelect(number)}
          >
            {favorites.has(`${examSlug}:${number}`) ? (
              <span aria-label={`즐겨찾기 ${number}`} className="absolute right-1 top-0 text-amber-400">
                ★
              </span>
            ) : null}
            {answered.has(number) ? <span className="mr-1 text-emerald-500">●</span> : null}
            {number}
          </button>
        ))}
      </div>
    </nav>
  );
}

