import { expect, test } from "@playwright/test";

const e2eEmail = process.env.E2E_CLERK_EMAIL;
const e2ePassword = process.env.E2E_CLERK_PASSWORD;

test.describe("authenticated workspace flows", () => {
  test.skip(!e2eEmail || !e2ePassword, "Authenticated E2E credentials were not provided.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");

    const emailField = page.locator('input[name="identifier"], input[type="email"]').first();
    await emailField.fill(e2eEmail!);
    await page.getByRole("button", { name: /continue|sign in/i }).first().click();

    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    await passwordField.fill(e2ePassword!);
    await page.getByRole("button", { name: /continue|sign in/i }).last().click();

    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
  });

  test("dashboard loads for an authenticated user", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test("rooms index loads and exposes room discovery state", async ({ page }) => {
    await page.goto("/rooms");
    await expect(page).toHaveURL(/\/rooms/);
    await expect(page.getByText(/rooms/i)).toBeVisible();
  });

  test("search screen loads without client-side failure after authentication", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByText(/search the live knowledge stream/i)).toBeVisible();
  });

  test("knowledge base screen loads for authenticated users", async ({ page }) => {
    await page.goto("/knowledge-base");
    await expect(page).toHaveURL(/\/knowledge-base/);
    await expect(page.getByText(/knowledge/i)).toBeVisible();
  });
});
