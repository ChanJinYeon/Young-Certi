type ExamTimerProps = {
  remainingSeconds: number;
};

function formatRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${rest
    .toString()
    .padStart(2, "0")}`;
}

export function ExamTimer({ remainingSeconds }: ExamTimerProps) {
  const tone =
    remainingSeconds <= 120
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : remainingSeconds <= 600
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-zinc-200 bg-white text-zinc-900";
  const liveMessage =
    remainingSeconds === 0 ? "시험 시간이 만료되었습니다." : `남은 시간 약 ${Math.ceil(remainingSeconds / 60)}분`;

  return (
    <section
      aria-label="시험 타이머"
      className={`flex h-9 items-center gap-2 rounded-md border px-3 shadow-sm ${tone}`}
    >
      <p className="text-xs font-medium text-zinc-500">남은 시간</p>
      <p className="font-mono text-sm font-semibold">{formatRemaining(remainingSeconds)}</p>
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}
