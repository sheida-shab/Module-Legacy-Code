import { test, expect } from "@playwright/test";
import { loginAsSample, logout, loginOnCurrentPage } from "./test-utils.mjs";

test("can visit another user's profile after logout and re-login", async ({
  page,
}) => {
  // Given I am logged in
  await loginAsSample(page);

  // And I visit another user's profile
  await page.goto("/#/profile/AS");

  // And I log out
  await logout(page);

  // When I log in again
  //await loginAsSample(page);
  await loginOnCurrentPage(page);
  // And I visit the same profile again
  await page.goto("/#/profile/AS");

  // Then I should see the profile view (NOT a server error)
  await expect(page.locator("#profile-container")).toBeVisible();

  await expect(page.locator("body")).not.toContainText(
    "Server does not support this operation",
  );
});
