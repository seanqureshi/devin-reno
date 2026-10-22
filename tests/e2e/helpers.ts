import { expect, type Page } from "@playwright/test";
import { execSync } from "node:child_process";

export const USERS = {
  owner: "owner@example.com",
  partner: "partner@example.com",
  electrician: "mike@brightline-electric.example", // Brightline Electric contractor
  plumber: "sara@summit-plumbing.example", // Summit Plumbing contractor
} as const;
export const PASSWORD = "password123";
export const PROJECT_NAME = "Kitchen & Primary Bath Remodel";

/** Re-seed the DB. Call in test.beforeEach/beforeAll when a spec mutates data. */
export function resetDb() {
  execSync("npm run db:reset", { stdio: "ignore" });
}

export async function login(page: Page, who: keyof typeof USERS) {
  const res = await page.request.post("/api/auth/login", { data: { email: USERS[who], password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
}

/** Logs in and opens the seeded sample project; returns its base URL path (/projects/<id>). */
export async function openProject(page: Page, who: keyof typeof USERS): Promise<string> {
  await login(page, who);
  await page.goto("/projects");
  await page.getByRole("link", { name: new RegExp(PROJECT_NAME.replace(/[&]/g, "&")) }).first().click();
  await expect(page.getByTestId("project-name")).toHaveText(PROJECT_NAME);
  const m = new URL(page.url()).pathname.match(/^\/projects\/[^/]+/);
  return m![0];
}
