import { Star } from "lucide-react";
import { useState } from "react";

import type { Correctness } from "../hooks/usePerQuestionResult";

type MenuStatus = Correctness | "answered";

type Props = {
  numbers: number[];
  current: number;
  statuses: Record<number, MenuStatus | null | undefined>;
  favorites?: Set<string>;
  examSlug?: string;
  navLabel?: string;
  mobileLabel?: string;
  getHref?: (number: number) => string;
  getLabel?: (number: number) => string;
  getAriaLabel?: (number: number, active: boolean, status: MenuStatus | null | undefined) => string;
  onSelect: (number: number) => void;
};

function dotClass(status: MenuStatus | null | undefined): string {
  // 600 shades clear the 3:1 non-text contrast bar against white (a11y).
  if (status === "correct" || status === "answered") return "bg-emerald-600";
  if (status === "incorrect" || status === "partial") return "bg-rose-600";
  return "bg-zinc-300";
}

export function SideMenu({
  numbers,
  current,
  statuses,
  favorites = new Set(),
  examSlug = "",
  navLabel = "문제 목록",
  mobileLabel = navLabel,
  getHref = (number) => `/${examSlug}/practice/${number}`,
  getLabel = (number) => String(number),
  getAriaLabel = (number) => `문제 ${number}`,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const answeredCount = numbers.filter((n) => statuses[n]).length;

  return (
    <nav
      aria-label={navLabel}
      className="border-b border-zinc-200 bg-white lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 lg:hidden"
      >
        <span>{mobileLabel}</span>
        <span className="font-mono text-xs text-zinc-500">
          {answeredCount}/{numbers.length}
        </span>
      </button>

      <ul
        className={`${open ? "block" : "hidden"} max-h-[60vh] overflow-y-auto px-2 pb-2 lg:block lg:max-h-[calc(100vh-1rem)] lg:py-2`}
      >
        {numbers.map((number) => {
          const active = number === current;
          const status = statuses[number];
          const favorite = favorites.has(`${examSlug}:${number}`);
          return (
            <li key={number}>
              <a
                href={getHref(number)}
                aria-label={getAriaLabel(number, active, status)}
                aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  onSelect(number);
                }}
                className={`flex min-h-11 items-center gap-2 rounded-md border-l-2 px-3 text-sm transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-100 font-medium text-zinc-900"
                    : "border-transparent text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${dotClass(status)}`}
                />
                <span className="font-mono">{getLabel(number)}</span>
                {favorite ? (
                  <span aria-label={`즐겨찾기 ${number}`} className="ml-auto inline-flex text-amber-400">
                    <Star aria-hidden size={13} fill="currentColor" strokeWidth={0} />
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
