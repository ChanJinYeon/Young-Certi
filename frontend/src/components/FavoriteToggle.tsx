import { Star } from "lucide-react";

type Props = {
  active: boolean;
  onToggle: () => void;
};

export function FavoriteToggle({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      aria-label={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      className="inline-flex h-10 w-10 items-center justify-center rounded border border-zinc-200"
      onClick={onToggle}
    >
      <Star aria-hidden fill={active ? "#f59e0b" : "none"} className={active ? "text-amber-500" : ""} />
    </button>
  );
}

