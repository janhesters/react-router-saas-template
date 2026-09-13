import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "../../fixtures";

test.describe("landing page", () => {
  test("given: an anonymous user, should: lack any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
