import { expect, test } from "@playwright/test";
import { openProject } from "./helpers";

test("demo login buttons sign in and show the sample project", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Alex Rivera/ }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByText("Kitchen & Primary Bath Remodel")).toBeVisible();
});

test("contractor nav is limited to their role", async ({ page }) => {
  await openProject(page, "electrician");
  const nav = page.getByRole("navigation", { name: "Project" });
  await expect(nav.getByRole("link", { name: "Task board" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Budget" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Quotes" })).toHaveCount(0);
});

test("owner sees all nav sections", async ({ page }) => {
  await openProject(page, "owner");
  const nav = page.getByRole("navigation", { name: "Project" });
  for (const label of ["Rooms", "Task board", "Schedule", "Budget", "Expenses", "Quotes", "Receipts", "Team & sharing"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
});
