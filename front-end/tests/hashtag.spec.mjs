import { test, expect } from "@playwright/test";

test("should not make infinite hashtag endpoint requests", async ({ page }) => {
  // ===== ARRANGE
  const requests = [];
  const hashtag = "SwizBiz";

  page.on("request", (request) => {
    if (
      request.url().includes(`:3000/hashtag/${hashtag}`) &&
      request.resourceType() === "fetch"
    ) {
      requests.push(request);
    }
  });
  // ====== ACT
  // When I navigate to the hashtag
  await page.goto(`/#/hashtag/${hashtag}`);

  // Wait for the hashtag API to respond before continuing
  await page.waitForResponse(
    (response) =>
      response.url().includes(`/hashtag/${hashtag}`) &&
      response.status() === 200,
  );

  // Give some time to catch repeated requests if they exist
  await page.waitForTimeout(500);

  // ====== ASSERT
  // Then the number of requests should be 1
  console.log("Number of requests:", requests.length);
  expect(requests.length).toEqual(1);
});
