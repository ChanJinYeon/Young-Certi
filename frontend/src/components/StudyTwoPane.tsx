import type { ReactNode } from "react";

type Props = {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
};

export function StudyTwoPane({ sidebar, topBar, children }: Props) {
  return (
    <div
      data-testid="study-two-pane-shell"
      className="grid min-h-screen w-full grid-cols-1 grid-rows-[3.5rem_auto_minmax(0,1fr)] bg-zinc-50 lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-[3.5rem_minmax(0,1fr)]"
    >
      <div
        data-testid="study-two-pane-top-bar"
        className="relative z-30 col-span-full row-start-1 flex h-14 items-center overflow-visible border-b border-zinc-200 bg-zinc-50/95 px-4 backdrop-blur sm:px-6"
      >
        {topBar}
      </div>
      <div data-testid="study-two-pane-sidebar" className="row-start-2 min-w-0 lg:col-start-1 lg:row-start-2">
        {sidebar}
      </div>
      <div id="main-content" data-testid="study-two-pane-content" className="row-start-3 min-w-0 lg:col-start-2 lg:row-start-2">
        {children}
      </div>
    </div>
  );
}
