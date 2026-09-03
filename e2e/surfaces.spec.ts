import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const surfaces = [
  {
    name: "player",
    url: "http://127.0.0.1:3000",
    heading: "Играй без риска. Проверяй каждый ход.",
  },
  {
    name: "admin",
    url: "http://127.0.0.1:3002",
    heading: "Demo operations",
  },
] as const;

for (const surface of surfaces) {
  test(`${surface.name} critic evidence`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(surface.url, { waitUntil: "networkidle" });
    await expect(page.getByRole("status")).toContainText(
      "DEMO • ТЕСТОВЫЕ СРЕДСТВА",
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      surface.heading,
    );
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    for (const link of await page.getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      const href = await link.getAttribute("href");
      if (href?.startsWith("#"))
        await expect(page.locator(href)).toHaveCount(1);
    }
    const transitionDuration = await page
      .locator("main")
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(transitionDuration).toBe("0s");
    await page.screenshot({
      path: `test-results/critic/round-1/${testInfo.project.name}/${surface.name}.png`,
      fullPage: true,
    });
  });
}

test("player navigation is keyboard accessible", async ({ page }) => {
  await page.goto("http://127.0.0.1:3000");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /CRYPTOGAMES/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Игры" })).toBeFocused();
});

test("admin navigation is keyboard accessible", async ({ page }) => {
  await page.goto("http://127.0.0.1:3002");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /CRYPTOGAMES/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Игроки" })).toBeFocused();
});
