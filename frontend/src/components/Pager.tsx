type PagerProps = {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  ariaLabel?: string;
};

const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

export function Pager({
  current,
  total,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  ariaLabel = "문제 이동",
}: PagerProps) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex items-center justify-center gap-2">
      <button type="button" className={buttonClass} disabled={prevDisabled} onClick={onPrev}>
        이전
      </button>
      <p className="min-w-16 text-center font-mono text-sm font-semibold text-zinc-800">
        {current} / {total}
      </p>
      <button type="button" className={buttonClass} disabled={nextDisabled} onClick={onNext}>
        다음
      </button>
    </div>
  );
}
