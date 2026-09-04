import { expect, request, test } from "@playwright/test";

const API = "http://127.0.0.1:3001/v1";

test("real PostgreSQL player journey is settled by the admin provider", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const email = `e2e-${suffix}@example.invalid`;
  const password = "e2e-demo-password-2026";

  await page.goto("http://127.0.0.1:3000/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator("form [role=status]")).toContainText("Готово");

  await page.goto("http://127.0.0.1:3000/wallet");
  await page.getByRole("button", { name: "Получить тестовые TSC" }).click();
  await expect(page.locator("p[role=status]")).toContainText("Начислено");

  const games = await page.context().request.get(`${API}/games`);
  expect(games.ok()).toBeTruthy();
  const [game] = (await games.json()) as Array<{ id: string; slug: string }>;
  if (!game) throw new Error("Seeded game catalog is empty");
  await page.goto(`http://127.0.0.1:3000/games/${game.slug}`);
  await page.getByRole("button", { name: /Запустить и поставить/ }).click();
  await expect(page.locator("p[role=status]")).toContainText("зарезервирована");

  const sessionsResponse = await page
    .context()
    .request.get(`${API}/me/game-sessions`);
  const [session] = (await sessionsResponse.json()) as Array<{
    id: string;
    wagers: Array<{ id: string }>;
  }>;
  const wagerId = session?.wagers[0]?.id;
  if (!wagerId) throw new Error("Reserved wager was not persisted");

  const admin = await request.newContext({ baseURL: `${API}/` });
  try {
    const login = await admin.post("auth/login", {
      data: {
        email: process.env.DEMO_ADMIN_EMAIL ?? "admin@example.invalid",
        password: process.env.DEMO_ACCOUNT_PASSWORD ?? "ci-demo-password-only",
      },
    });
    expect(login.ok()).toBeTruthy();
    expect(
      (
        await admin.post(`admin/games/${game.id}/scenario`, {
          data: { scenario: "WIN_SMALL" },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (await admin.post(`admin/wagers/${wagerId}/simulate`, { data: {} })).ok(),
    ).toBeTruthy();
  } finally {
    await admin.dispose();
  }

  await expect(page.locator("p[role=status]")).toContainText("WIN_SMALL", {
    timeout: 15_000,
  });
  await page.goto("http://127.0.0.1:3000/transactions");
  await expect(page.getByText("GAME_SETTLEMENT")).toBeVisible();
  await page.goto("http://127.0.0.1:3000/sessions");
  await expect(page.getByRole("status")).toContainText("COMPLETED");
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
});
