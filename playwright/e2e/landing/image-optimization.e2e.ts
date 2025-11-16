import { expect, test } from "@playwright/test";

test.describe("image optimization", () => {
  test("should: serve optimized image with default dimensions", async ({
    request,
  }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-light.png",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect(response.headers()["cache-control"]).toContain("public");
    expect(response.headers()["cache-control"]).toContain("max-age=31536000");
    expect(response.headers()["cache-control"]).toContain("immutable");
  });

  test("should: serve optimized image with custom width", async ({
    request,
  }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("should: serve optimized image with custom width and height", async ({
    request,
  }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920&h=680",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("should: serve dark theme image variant", async ({ request }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-dark.png&w=1920",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
  });

  test("should: load optimized images in landing page", async ({ page }) => {
    await page.goto("/");

    // Wait for hero images to load
    const lightImage = page.locator('img[alt*="light"]').first();
    await expect(lightImage).toBeVisible();

    // Check that image src uses optimization endpoint
    const src = await lightImage.getAttribute("src");
    expect(src).toContain("/resources/images");
    expect(src).toContain("src=/images/");

    // Verify image actually loaded (not broken)
    const naturalWidth = await lightImage.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test("should: generate responsive srcset", async ({ page }) => {
    await page.goto("/");

    const heroImage = page.locator('img[alt*="light"]').first();
    await expect(heroImage).toBeVisible();

    const srcset = await heroImage.getAttribute("srcset");
    expect(srcset).toBeTruthy();

    // Verify srcset contains multiple sizes
    expect(srcset).toContain("600w");
    expect(srcset).toContain("1200w");
  });
});
