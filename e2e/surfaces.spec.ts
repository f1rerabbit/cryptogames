import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const surface of [
  {
    name: "player",
    url: "http://127.0.0.1:3000",
    heading: "Игровое лобби готовится",
  },
  {
    name: "admin",
    url: "http://127.0.0.1:3002",
    heading: "Панель администратора",
  },
]) {
  test(`${surface.name} skeleton is accessible and responsive`, async ({
    page,
  }, testInfo) => {
    await page.goto(surface.url);
    await expect(page.getByRole("status")).toContainText(
      "DEMO • ТЕСТОВЫЕ СРЕДСТВА",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      surface.heading,
    );
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`${surface.name}.png`),
      fullPage: true,
    });
  });
}

test("player navigation is keyboard accessible", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Каталог" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#catalog$/);
});

test("admin navigation is keyboard accessible", async ({ page }) => {
  await page.goto("http://127.0.0.1:3002");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "К статусу" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#status$/);
});
