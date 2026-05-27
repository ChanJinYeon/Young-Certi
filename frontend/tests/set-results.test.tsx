import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSetResults } from "../src/hooks/useSetResults";

describe("useSetResults", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores results under a set-scoped key without touching practice or other sets", () => {
    localStorage.setItem(
      "young-certi/v1/session-1/results",
      JSON.stringify({
        "sap-c02:1": {
          examSlug: "sap-c02",
          number: 1,
          selected: ["B"],
          submittedAt: "2026-05-27T00:00:00.000Z",
          correctness: "incorrect",
        },
      }),
    );
    localStorage.setItem(
      "young-certi/v1/session-1/set-results/set-2",
      JSON.stringify({
        1: {
          examSlug: "sap-c02",
          number: 1,
          selected: ["C"],
          submittedAt: "2026-05-27T00:00:00.000Z",
          correctness: "incorrect",
        },
      }),
    );
    const hook = renderHook(() => useSetResults("session-1", "set-1"));

    act(() =>
      hook.result.current.saveResult({
        examSlug: "sap-c02",
        number: 1,
        selected: ["A"],
        submittedAt: "2026-05-27T00:00:00.000Z",
        correctness: "correct",
      }),
    );

    expect(hook.result.current.getResult(1)?.correctness).toBe("correct");
    expect(localStorage.getItem("young-certi/v1/session-1/results")).toContain("incorrect");
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-2")).toContain("C");
  });

  it("clears only one set-scoped result", () => {
    const hook = renderHook(() => useSetResults("session-1", "set-1"));

    act(() => {
      hook.result.current.saveResult({
        examSlug: "sap-c02",
        number: 1,
        selected: ["A"],
        submittedAt: "2026-05-27T00:00:00.000Z",
        correctness: "correct",
      });
      hook.result.current.saveResult({
        examSlug: "sap-c02",
        number: 2,
        selected: ["B"],
        submittedAt: "2026-05-27T00:00:00.000Z",
        correctness: "incorrect",
      });
    });

    act(() => hook.result.current.clearResult(1));

    expect(hook.result.current.getResult(1)).toBeUndefined();
    expect(hook.result.current.getResult(2)?.selected).toEqual(["B"]);
  });
});
