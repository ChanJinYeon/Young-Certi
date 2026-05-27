import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App";
import { useExamAttempt, type ExamGradingQuestion } from "../src/hooks/useExamAttempt";

const gradingQuestions: ExamGradingQuestion[] = [
  { number: 1, answerKey: ["A"] },
  { number: 2, answerKey: ["A", "C"] },
  { number: 3, answerKey: ["B"] },
  { number: 4, answerKey: ["D"] },
];

describe("useExamAttempt", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with 75 random questions or all available questions when the pool is smaller", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T00:00:00.000Z"));
    const hook = renderHook(() => useExamAttempt("session-1", "sap-c02"));
    const many = Array.from({ length: 100 }, (_, index) => index + 1);

    act(() => hook.result.current.start(many));
    expect(hook.result.current.attempt?.questionNumbers).toHaveLength(75);
    expect(new Set(hook.result.current.attempt?.questionNumbers).size).toBe(75);
    expect(hook.result.current.attempt?.durationMinutes).toBe(180);

    act(() => hook.result.current.start([1, 2, 3], { extraTime: true }));
    expect(hook.result.current.attempt?.questionNumbers).toEqual([1, 2, 3]);
    expect(hook.result.current.attempt?.durationMinutes).toBe(210);
  });

  it("answers, resumes, and stays isolated from practice storage keys", () => {
    const hook = renderHook(() => useExamAttempt("session-1", "sap-c02"));

    act(() => hook.result.current.start([1, 2, 3]));
    act(() => hook.result.current.answer(1, ["A"]));

    localStorage.setItem("young-certi/v1/session-1/results", JSON.stringify({ "sap-c02:1": { selected: ["B"] } }));
    localStorage.setItem("young-certi/v1/session-1/favorites", JSON.stringify(["sap-c02:1"]));
    localStorage.setItem("young-certi/v1/session-1/sets", JSON.stringify([{ name: "Review" }]));

    const remount = renderHook(() => useExamAttempt("session-1", "sap-c02"));

    expect(remount.result.current.attempt?.answers[1]).toEqual(["A"]);
    expect(localStorage.getItem("young-certi/v1/session-1/results")).toContain("sap-c02:1");
    expect(localStorage.getItem("young-certi/v1/session-1/favorites")).toContain("sap-c02:1");
    expect(localStorage.getItem("young-certi/v1/session-1/sets")).toContain("Review");
  });

  it("derives remaining time and expiration from the wall clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T00:00:00.000Z"));
    const hook = renderHook(() => useExamAttempt("session-1", "sap-c02"));

    act(() => hook.result.current.start([1], { durationMinutes: 1 }));
    expect(hook.result.current.remainingSeconds).toBe(60);
    expect(hook.result.current.isExpired).toBe(false);

    vi.setSystemTime(new Date("2026-05-27T00:00:30.000Z"));
    hook.rerender();
    expect(hook.result.current.remainingSeconds).toBe(30);

    vi.setSystemTime(new Date("2026-05-27T00:01:01.000Z"));
    hook.rerender();
    expect(hook.result.current.remainingSeconds).toBe(0);
    expect(hook.result.current.isExpired).toBe(true);
  });

  it("submits with score, percent, and pass threshold", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-27T00:00:00.000Z"));
    const hook = renderHook(() => useExamAttempt("session-1", "sap-c02"));

    act(() => hook.result.current.start([1, 2, 3, 4]));
    act(() => hook.result.current.answer(1, ["A"]));
    act(() => hook.result.current.answer(2, ["A", "C"]));
    act(() => hook.result.current.answer(3, ["B"]));
    act(() => hook.result.current.answer(4, ["A"]));
    act(() => hook.result.current.submit(gradingQuestions));

    expect(hook.result.current.attempt?.status).toBe("submitted");
    expect(hook.result.current.attempt?.score).toEqual({
      correct: 3,
      total: 4,
      percent: 75,
      pass: true,
    });
    expect(hook.result.current.remainingSeconds).toBe(0);
  });
});

describe("exam route", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the exam route stub", async () => {
    window.history.pushState({}, "", "/sap-c02/exam");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "시험 모드" })).toBeInTheDocument();
  });
});
