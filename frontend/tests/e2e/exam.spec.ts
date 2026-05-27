import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("starts an exam, answers, submits, and shows a per-question result review", async ({ page, request }) => {
  await page.goto("/sap-c02/exam");
  await expect(page.getByRole("heading", { name: "시험 모드" })).toBeVisible();

  await page.getByRole("button", { name: "시험 시작" }).click();
  const heading = page.getByRole("heading", { name: /문제 \d+/ });
  await expect(heading).toBeVisible();
  await expect(page.getByLabel("시험 타이머")).toBeVisible();
  const currentNumber = Number((await heading.textContent())?.match(/\d+/)?.[0]);
  const question = await (await request.get(`http://api:8000/exams/sap-c02/questions/${currentNumber}`)).json();

  for (const answer of question.answerKey) {
    await page.getByLabel(new RegExp(`^${answer}\\.`)).check();
  }
  await expect(page.getByText("정답 선택")).not.toBeVisible();

  await page.getByRole("button", { name: "시험 제출" }).click();
  await expect(page.getByRole("dialog", { name: "시험 제출 확인" })).toBeVisible();
  await page.getByRole("button", { name: "제출하기" }).click();

  await expect(page.getByRole("heading", { name: "시험 결과" })).toBeVisible();
  await expect(page.getByText(/%$/).first()).toBeVisible();
  await expect(page.getByText("내 답:").first()).toBeVisible();
  await expect(page.getByText("정답:").first()).toBeVisible();
});

test("auto-submits an expired resumed exam and does not mutate practice state", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("young-certi/sessionId", "exam-e2e-session");
    window.localStorage.setItem(
      "young-certi/v1/exam-e2e-session/current",
      JSON.stringify({ "sap-c02": 20 }),
    );
    window.localStorage.setItem("young-certi/v1/exam-e2e-session/favorites", JSON.stringify(["sap-c02:1"]));
    window.localStorage.setItem(
      "young-certi/v1/exam-e2e-session/sets",
      JSON.stringify([{ id: "set-1", name: "Practice", questionRefs: [{ examSlug: "sap-c02", number: 1 }] }]),
    );
    window.localStorage.setItem(
      "young-certi/v1/exam-e2e-session/results",
      JSON.stringify({
        "sap-c02:1": {
          examSlug: "sap-c02",
          number: 1,
          selected: ["A"],
          submittedAt: "2026-05-27T00:00:00.000Z",
          correctness: "correct",
        },
      }),
    );
    window.localStorage.setItem(
      "young-certi/v1/exam-e2e-session/exam/sap-c02",
      JSON.stringify({
        examSlug: "sap-c02",
        questionNumbers: [1, 2],
        answers: { 1: ["A"] },
        startedAt: "2000-01-01T00:00:00.000Z",
        durationMinutes: 1,
        status: "in-progress",
        submittedAt: null,
        score: null,
      }),
    );
  });

  await page.goto("/sap-c02/exam");
  await expect(page.getByRole("heading", { name: "시험 결과" })).toBeVisible();
  await expect(page.getByText("내 답:").first()).toBeVisible();

  const persisted = await page.evaluate(() => {
    const sessionId = window.localStorage.getItem("young-certi/sessionId");
    if (!sessionId) return null;
    return {
      favorites: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/favorites`) ?? "[]"),
      sets: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/sets`) ?? "[]"),
      results: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/results`) ?? "{}"),
      current: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/current`) ?? "{}"),
      exam: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/exam/sap-c02`) ?? "null"),
    };
  });

  expect(persisted?.favorites).toEqual(["sap-c02:1"]);
  expect(persisted?.sets).toEqual([
    expect.objectContaining({
      name: "Practice",
      questionRefs: [{ examSlug: "sap-c02", number: 1 }],
    }),
  ]);
  expect(persisted?.results["sap-c02:1"]).toEqual(
    expect.objectContaining({
      selected: ["A"],
      correctness: "correct",
    }),
  );
  expect(persisted?.current).toEqual({ "sap-c02": 20 });
  expect(persisted?.exam.status).toBe("submitted");
});
