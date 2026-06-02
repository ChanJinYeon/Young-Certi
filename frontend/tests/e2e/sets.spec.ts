import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("opens a saved set from landing and solves it with set-scoped feedback", async ({ page, request }) => {
  const question = await (await request.get("http://api:8000/exams/sap-c02/questions/1")).json();

  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("young-certi/sessionId", "sets-e2e-session");
    window.localStorage.setItem(
      "young-certi/v1/sets-e2e-session/sets",
      JSON.stringify([
        {
          id: "set-1",
          name: "Review",
          createdAt: "2026-05-27T00:00:00.000Z",
          questionRefs: [{ examSlug: "sap-c02", number: 1 }],
        },
      ]),
    );
  });

  await page.getByRole("link", { name: /AWS SAP-C02/ }).click();
  await page.getByRole("link", { name: /문제집/ }).click();

  await expect(page).toHaveURL(/\/sap-c02\/sets$/);
  await expect(page.getByRole("heading", { name: "문제집" })).toBeVisible();
  await expect(page.getByRole("article", { name: "Review 문제집" })).toContainText("1문항");

  await page.getByRole("link", { name: "Review 열기" }).click();

  await expect(page).toHaveURL(/\/sap-c02\/sets\/set-1$/);
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByText(question.text)).toBeVisible();

  for (const answer of question.answerKey) {
    await page.getByLabel(new RegExp(`^${answer}\\.`)).check();
  }
  await page.getByRole("button", { name: "제출" }).click();

  await expect(page.getByText("정답 선택")).toBeVisible();
  await expect(page.getByLabel("채점 결과")).toBeVisible();

  const persisted = await page.evaluate(() => {
    const sessionId = window.localStorage.getItem("young-certi/sessionId");
    if (!sessionId) return null;
    return {
      practice: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/results`) ?? "{}"),
      set: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/set-results/set-1`) ?? "{}"),
    };
  });

  expect(persisted?.practice).toEqual({});
  expect(persisted?.set["1"]).toEqual(
    expect.objectContaining({
      selected: question.answerKey,
      correctness: "correct",
    }),
  );
});

test("creates an empty set from sets, adds a practice question, and toggles set sort", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /AWS SAP-C02/ }).click();
  await page.getByRole("link", { name: /시험 모드/ }).click();

  await expect(page).toHaveURL(/\/sap-c02\/exam$/);
  await page.getByRole("link", { name: "홈으로" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "YoungCerti" })).toBeVisible();

  await page.getByRole("link", { name: /AWS SAP-C02/ }).click();
  await page.getByRole("link", { name: /문제집/ }).click();
  await page.getByRole("button", { name: "문제집 추가" }).click();
  await page.getByLabel("문제집 이름").fill("Review");
  await page.getByRole("button", { name: "확인" }).click();

  await expect(page.getByRole("article", { name: "Review 문제집" })).toContainText("0문항");

  await page.goto("/sap-c02/practice");
  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();
  await page.getByRole("button", { name: "문제집에 추가" }).click();
  await page.getByRole("button", { name: "Review 0" }).click();

  await page.goto("/sap-c02/sets");
  await expect(page.getByRole("article", { name: "Review 문제집" })).toContainText("1문항");
  await page.getByRole("link", { name: "Review 열기" }).click();

  await expect(page).toHaveURL(/\/sap-c02\/sets\//);
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.getByRole("button", { name: "문제 번호 순서" }).click();
  await expect(page.getByRole("button", { name: "문제 번호 순서" })).toHaveAttribute("aria-pressed", "true");
});
