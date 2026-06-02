import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  backTo?: string;
  backLabel?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export function PageHeader({ backTo, backLabel = "뒤로", eyebrow, title, description }: Props) {
  return (
    <header className="space-y-3 pb-1">
      {backTo ? (
        <Link
          to={backTo}
          className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          {backLabel}
        </Link>
      ) : null}
      {eyebrow ? <p className="text-sm font-medium text-zinc-500">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold text-zinc-950">{title}</h1>
      {description ? <p className="max-w-2xl leading-relaxed text-zinc-600">{description}</p> : null}
    </header>
  );
}
