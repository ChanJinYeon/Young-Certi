import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("enters practice from the home and landing in two clicks", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "YoungCerti" })).toBeVisible();
  await page.getByRole("link", { name: /AWS SAP-C02/ }).click();

  await expect(page).toHaveURL(/\/sap-c02\/$/);
  await expect(page.getByRole("heading", { name: "AWS SAP-C02" })).toBeVisible();
  await expect(page.getByText(/문항$/)).toBeVisible();

  await page.getByRole("button", { name: /시험 모드/ }).click({ force: true });
  await expect(page).toHaveURL(/\/sap-c02\/$/);

  await page.getByRole("link", { name: /문제 풀이/ }).click();
  await expect(page).toHaveURL(/\/sap-c02\/practice$/);
  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();
});

test("full-stack happy path preserves answer, favorite, set, and reload state", async ({ page, request }) => {
  const question = await (await request.get("http://api:8000/exams/sap-c02/questions/1")).json();

  await page.goto("/sap-c02/practice");

  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();
  await expect(page.getByText(question.text)).toBeVisible();

  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.getByText("선지를 하나 이상 선택하세요.")).toBeVisible();

  for (const answer of question.answerKey) {
    await page.getByLabel(new RegExp(`^${answer}\\.`)).check();
  }
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.getByText("정답 선택")).toBeVisible();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "문제 2" })).toBeVisible();

  await page.getByRole("button", { name: "이전" }).click();
  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();
  await expect(page.getByText("정답 선택")).toBeVisible();

  await page.getByRole("button", { name: "즐겨찾기 추가" }).click();
  await expect(page.getByRole("button", { name: "즐겨찾기 해제" })).toBeVisible();

  await page.getByRole("button", { name: "문제집에 추가" }).click();
  await page.getByLabel("문제집 이름").fill("Review");
  await page.getByRole("button", { name: "추가", exact: true }).click();

  await page.reload();
  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();
  await expect(page.getByText("정답 선택")).toBeVisible();
  await expect(page.getByRole("button", { name: "즐겨찾기 해제" })).toBeVisible();

  const persisted = await page.evaluate(() => {
    const sessionId = window.localStorage.getItem("young-certi/sessionId");
    if (!sessionId) return null;
    return {
      favorites: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/favorites`) ?? "[]"),
      sets: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/sets`) ?? "[]"),
      results: JSON.parse(window.localStorage.getItem(`young-certi/v1/${sessionId}/results`) ?? "{}"),
    };
  });

  expect(persisted?.favorites).toContain("sap-c02:1");
  expect(persisted?.sets).toEqual([
    expect.objectContaining({
      name: "Review",
      questionRefs: [{ examSlug: "sap-c02", number: 1 }],
    }),
  ]);
  expect(persisted?.results["sap-c02:1"]).toEqual(
    expect.objectContaining({
      selected: question.answerKey,
      correctness: "correct",
    }),
  );
});

test("reload restores the current question from localStorage", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("young-certi/sessionId", "e2e-session");
    window.localStorage.setItem("young-certi/v1/e2e-session/current", JSON.stringify({ "sap-c02": 20 }));
  });

  await page.goto("/sap-c02/practice");
  await expect(page.getByRole("heading", { name: "문제 20" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "문제 20" })).toBeVisible();
});

test("landing resumes the last viewed question", async ({ page }) => {
  await page.goto("/sap-c02/practice");
  await expect(page.getByRole("heading", { name: "문제 1" })).toBeVisible();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "문제 2" })).toBeVisible();

  await page.goto("/sap-c02/");
  await expect(page.getByRole("link", { name: /이어 풀기.*2번/ })).toBeVisible();
  await page.getByRole("link", { name: /이어 풀기.*2번/ }).click();
  await expect(page.getByRole("heading", { name: "문제 2" })).toBeVisible();
});

test("allows CORS preflight from the compose web origin", async ({ request }) => {
  const response = await request.fetch("http://api:8000/exams", {
    method: "OPTIONS",
    headers: {
      Origin: "http://web:5173",
      "Access-Control-Request-Method": "GET",
    },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBe("http://web:5173");
});
