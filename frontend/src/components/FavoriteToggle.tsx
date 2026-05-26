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
      aria-pressed={active}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 transition-transform duration-150 hover:bg-zinc-50 active:scale-90"
      onClick={onToggle}
    >
      <Star
        aria-hidden
        size={20}
        strokeWidth={active ? 0 : 2}
        className={active ? "text-amber-400" : "text-zinc-500"}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
