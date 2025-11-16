import { expect, test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
}

setup("authenticate", async ({ page, baseURL }) => {
  console.log("Performing auth setup steps...");

  // Perform authentication steps. Replace these actions with your own.
  await page.goto(baseURL + "/auth/login");
  await page.getByLabel("Email").fill(E2E_USERNAME);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL(baseURL + "/app/conversations/new");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();

  // End of authentication steps.
  await page.context().storageState({ path: authFile });

  console.log("Auth setup don.");
});
