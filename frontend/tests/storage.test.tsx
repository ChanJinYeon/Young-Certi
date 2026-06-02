import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFavorites } from "../src/hooks/useFavorites";
import { useLocalSession } from "../src/hooks/useLocalSession";
import { usePerQuestionResult } from "../src/hooks/usePerQuestionResult";
import { useQuestionSets } from "../src/hooks/useQuestionSets";

describe("localStorage hooks", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("creates and reuses a session id", () => {
    const first = renderHook(() => useLocalSession());
    const second = renderHook(() => useLocalSession());

    expect(first.result.current.sessionId).toBe(second.result.current.sessionId);
    expect(first.result.current.isEphemeral).toBe(false);
  });

  it("falls back to ephemeral mode when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    const hook = renderHook(() => useLocalSession());

    expect(hook.result.current.isEphemeral).toBe(true);
  });

  it("toggles favorites and survives a hook remount", () => {
    const hook = renderHook(() => useFavorites("session-1"));

    act(() => hook.result.current.toggleFavorite("sap-c02", 1));
    expect(hook.result.current.isFavorite("sap-c02", 1)).toBe(true);

    const remount = renderHook(() => useFavorites("session-1"));
    expect(remount.result.current.isFavorite("sap-c02", 1)).toBe(true);
  });

  it("stores per-question results", () => {
    const hook = renderHook(() => usePerQuestionResult("session-1"));

    act(() =>
      hook.result.current.saveResult({
        examSlug: "sap-c02",
        number: 1,
        selected: ["A"],
        submittedAt: "2026-05-26T00:00:00.000Z",
        correctness: "correct",
      }),
    );

    expect(hook.result.current.getResult("sap-c02", 1)?.correctness).toBe("correct");
  });

  it("reuses same-name question sets and does not duplicate questions", () => {
    const hook = renderHook(() => useQuestionSets("session-1"));

    act(() => hook.result.current.addToSet("Review", { examSlug: "sap-c02", number: 1 }));
    act(() => hook.result.current.addToSet("Review", { examSlug: "sap-c02", number: 1 }));

    expect(hook.result.current.sets).toHaveLength(1);
    expect(hook.result.current.sets[0].questionRefs).toEqual([{ examSlug: "sap-c02", number: 1 }]);
  });

  it("creates a set with multiple real question refs in one storage update", () => {
    const hook = renderHook(() => useQuestionSets("session-1"));

    act(() =>
      hook.result.current.createSetWithRefs("Wrong answers", [
        { examSlug: "sap-c02", number: 10 },
        { examSlug: "sap-c02", number: 20 },
        { examSlug: "sap-c02", number: 10 },
      ]),
    );

    expect(hook.result.current.sets).toHaveLength(1);
    expect(hook.result.current.sets[0]).toEqual(
      expect.objectContaining({
        name: "Wrong answers",
        questionRefs: [
          { examSlug: "sap-c02", number: 10 },
          { examSlug: "sap-c02", number: 20 },
        ],
      }),
    );
    expect(JSON.parse(localStorage.getItem("young-certi/v1/session-1/sets") ?? "[]")[0].questionRefs).toEqual([
      { examSlug: "sap-c02", number: 10 },
      { examSlug: "sap-c02", number: 20 },
    ]);
  });

  it("deletes only the targeted set and removes its set-scoped results", () => {
    localStorage.setItem(
      "young-certi/v1/session-1/sets",
      JSON.stringify([
        {
          id: "set-1",
          name: "Review",
          createdAt: "2026-05-27T00:00:00.000Z",
          questionRefs: [{ examSlug: "sap-c02", number: 1 }],
        },
        {
          id: "set-2",
          name: "Hard",
          createdAt: "2026-05-27T00:00:00.000Z",
          questionRefs: [{ examSlug: "sap-c02", number: 2 }],
        },
      ]),
    );
    localStorage.setItem("young-certi/v1/session-1/set-results/set-1", JSON.stringify({ 1: { selected: ["A"] } }));
    localStorage.setItem("young-certi/v1/session-1/set-results/set-2", JSON.stringify({ 2: { selected: ["B"] } }));
    const hook = renderHook(() => useQuestionSets("session-1"));

    act(() => hook.result.current.deleteSet("set-1"));

    expect(hook.result.current.sets.map((set) => set.id)).toEqual(["set-2"]);
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-1")).toBeNull();
    expect(localStorage.getItem("young-certi/v1/session-1/set-results/set-2")).toContain("B");
  });

  it("removes a question from only the targeted set", () => {
    localStorage.setItem(
      "young-certi/v1/session-1/sets",
      JSON.stringify([
        {
          id: "set-1",
          name: "Review",
          createdAt: "2026-05-27T00:00:00.000Z",
          questionRefs: [
            { examSlug: "sap-c02", number: 1 },
            { examSlug: "sap-c02", number: 2 },
          ],
        },
        {
          id: "set-2",
          name: "Hard",
          createdAt: "2026-05-27T00:00:00.000Z",
          questionRefs: [{ examSlug: "sap-c02", number: 1 }],
        },
      ]),
    );
    const hook = renderHook(() => useQuestionSets("session-1"));

    act(() => hook.result.current.removeQuestion("set-1", { examSlug: "sap-c02", number: 1 }));

    expect(hook.result.current.sets.find((set) => set.id === "set-1")?.questionRefs).toEqual([
      { examSlug: "sap-c02", number: 2 },
    ]);
    expect(hook.result.current.sets.find((set) => set.id === "set-2")?.questionRefs).toEqual([
      { examSlug: "sap-c02", number: 1 },
    ]);
  });
});
