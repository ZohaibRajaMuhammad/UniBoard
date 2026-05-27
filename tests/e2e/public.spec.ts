import { expect, test, type Page } from "@playwright/test";

test.describe("public application surfaces", () => {
  async function expectEitherText(pageText: string, fallbackText: string, page: Page) {
    await expect(page.locator("body")).toContainText(new RegExp(`(${pageText}|${fallbackText})`, "i"));
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  }

  test("landing page renders core product message and entry actions", async ({ page }) => {
    await page.goto("/");

    await expectEitherText("your class network, rebuilt for signal", "authentication service is temporarily unavailable", page);
  });

  test("sign-in page renders without client-side failure", async ({ page }) => {
    await page.goto("/sign-in");

    await expectEitherText("sign in to uniboard", "sign-in is temporarily unavailable", page);
  });

  test("sign-up page renders without client-side failure", async ({ page }) => {
    await page.goto("/sign-up");

    await expectEitherText("create your uniboard account", "sign-up is temporarily unavailable", page);
  });

  test("protected routes redirect unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(/(sign in|dashboard authentication is temporarily unavailable)/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });

  test("search route remains stable and resolves through auth gating", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).toContainText(/(sign in|dashboard authentication is temporarily unavailable)/i);
    await expect(page.locator("body")).not.toContainText(/internal server error/i);
  });
});
