import { test, expect } from "@playwright/test";
import { loginAsSample } from "./test-utils";

test("server should reject blooms longer than 280 characters", async ({
  page,
}) => {

  await loginAsSample(page);

  const longBloom = "A".repeat(281);

  const result = await page.evaluate(async (content) => {
    const res = await fetch("/bloom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", 
      body: JSON.stringify({ content }),
    });

     if (!res.ok) {
      try {
        return await res.json();
      } catch {
        return { success: false };
      }
    }

    return await res.json();
  }, longBloom);

  expect(result.success).toBe(false);
});
