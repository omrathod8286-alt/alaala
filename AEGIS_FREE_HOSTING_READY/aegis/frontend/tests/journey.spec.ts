import { test, expect } from "@playwright/test";
test("Golden Journey and ownership investigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await page.getByRole("button", { name: "Jury Demo", exact: true }).click();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Demo reset");
  await page.getByLabel("Playback speed").selectOption("2");
  await page.getByRole("button", { name: "Run journey" }).click();
  await expect(page.getByText("9 / 9 steps completed")).toBeVisible();
  await page.getByRole("button", { name: "Provenance", exact: true }).click();
  await page.getByRole("listitem").filter({ hasText: "demo-asset" }).click();
  await expect(
    page.getByRole("definition").filter({ hasText: "did:aegis:recipient" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "denied", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
  });
});
test("mobile login is usable and unauthorized mint rejected by API", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByLabel("Demo identity")).toBeVisible();
  await page.getByLabel("Demo identity").selectOption("user");
  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Digital assets" }),
  ).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(overflow).toBe(false);
  const response = await request.post(
    "http://127.0.0.1:8000/api/demo/session",
    { data: { persona: "user" } },
  );
  const { access_token } = await response.json();
  const denied = await request.post("http://127.0.0.1:8000/api/commands", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Idempotency-Key": "e2e-unauthorized",
    },
    data: {
      action: "asset.mint",
      subject: "e2e-forbidden",
      metadata_hash: "b".repeat(64),
    },
  });
  expect(denied.status()).toBe(403);
  await page.screenshot({
    path: "test-results/workspace-mobile.png",
    fullPage: true,
  });
});
