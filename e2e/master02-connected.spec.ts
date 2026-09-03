import { expect, test } from "@playwright/test";
test("player renders current API wallet/catalog changes and stores no token", async ({
  page,
}) => {
  let balance = "100",
    games = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "live-game",
        name: "Live Game",
        category: "TEST",
        minBet: "10",
        maxBet: "20",
      },
    ];
  await page.route("http://127.0.0.1:3001/v1/**", async (route) => {
    const url = route.request().url();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        url.endsWith("/me/wallet") ? { available: balance } : games,
      ),
    });
  });
  await page.goto("http://127.0.0.1:3000");
  await expect(page.getByText("100 TSC")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live Game" })).toBeVisible();
  balance = "250";
  games = [];
  await page.reload();
  await expect(page.getByText("250 TSC")).toBeVisible();
  await expect(page.getByText("Активных игр пока нет.")).toBeVisible();
  expect(
    await page.evaluate(() => ({
      local: [...Object.keys(localStorage)],
      session: [...Object.keys(sessionStorage)],
    })),
  ).toEqual({ local: [], session: [] });
});
test("admin game PATCH refreshes live API state without browser token storage", async ({
  page,
}) => {
  let active = true;
  await page.route("http://127.0.0.1:3001/v1/admin/games**", async (route) => {
    if (route.request().method() === "PATCH") active = false;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        route.request().method() === "GET"
          ? [
              {
                id: "11111111-1111-1111-1111-111111111111",
                name: "Managed Game",
                active,
                minBet: "10",
                maxBet: "20",
                sortOrder: 1,
              },
            ]
          : { active },
      ),
    });
  });
  await page.goto("http://127.0.0.1:3002/games");
  await expect(page.getByText("Managed Game")).toBeVisible();
  await page.getByRole("button", { name: "Деактивировать" }).click();
  await expect(
    page.getByRole("button", { name: "Активировать" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0);
});
