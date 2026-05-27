import { ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";

type EntryCardProps = {
  title: string;
  description: string;
  to?: string;
  disabled?: boolean;
};

const cardClass =
  "flex min-h-24 w-full items-center justify-between gap-4 rounded-lg border p-4 text-left shadow-sm";

export function EntryCard({ title, description, to, disabled = false }: EntryCardProps) {
  const content = (
    <>
      <span className="min-w-0 space-y-1">
        <span className="block text-lg font-semibold text-zinc-900">{title}</span>
        <span className="block text-sm leading-relaxed text-zinc-600">{description}</span>
      </span>
      {disabled ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
          <Lock aria-hidden size={13} />
          준비 중
        </span>
      ) : (
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500">
          <ArrowRight aria-hidden size={18} />
        </span>
      )}
    </>
  );

  if (disabled || !to) {
    return (
      <button
        type="button"
        aria-disabled="true"
        className={`${cardClass} cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-80`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`${cardClass} border-zinc-900 bg-white transition-colors hover:bg-zinc-50`}
    >
      {content}
    </Link>
  );
}
