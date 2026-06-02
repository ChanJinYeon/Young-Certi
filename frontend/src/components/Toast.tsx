import { useEffect } from "react";

type ToastProps = {
  message: string;
  tone?: "success" | "error";
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({ message, tone = "success", onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss]);

  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div
      role="status"
      className={`fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-md border px-4 py-3 text-sm font-medium shadow-lg ${toneClass}`}
    >
      {message}
    </div>
  );
}
