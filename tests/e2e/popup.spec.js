import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const profile = {
      name: "Sam Rivera",
      headline: "Engineering Lead at Example Labs",
      fullText: "Sam builds reliable distributed systems for climate data.",
      extractedCharacters: 56,
    };
    window.chrome = {
      storage: {
        local: {
          async get() {
            return { settings: {} };
          },
          async set() {},
          async remove() {},
        },
      },
      tabs: {
        async query() {
          return [{ id: 1, url: "https://www.linkedin.com/in/sam-rivera/" }];
        },
        async sendMessage() {
          return { success: true, data: profile };
        },
      },
      scripting: { async executeScript() {} },
    };
  });
  await page.goto("/popup.html");
});

test("shows a local settings flow and recipient preview", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Local settings" }),
  ).toBeVisible();
  await expect(page.getByText("Sam Rivera")).toBeVisible();
  await expect(page.getByText(/Nothing has been sent to Gemini/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate draft" }),
  ).toBeDisabled();
});

test("exposes the data-deletion control", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Delete local data" }),
  ).toBeVisible();
});
