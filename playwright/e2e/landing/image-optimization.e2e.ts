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

  test("should: handle format parameter (webp)", async ({ request }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920&format=webp",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("should: handle format parameter (avif)", async ({ request }) => {
    const response = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920&format=avif",
    );

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("should: apply fit parameter correctly", async ({ request }) => {
    const coverResponse = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920&h=680&fit=cover",
    );

    expect(coverResponse.status()).toBe(200);
    expect(coverResponse.headers()["content-type"]).toMatch(/^image\//);

    const containResponse = await request.get(
      "/resources/images?src=/images/app-light.png&w=1920&h=680&fit=contain",
    );

    expect(containResponse.status()).toBe(200);
    expect(containResponse.headers()["content-type"]).toMatch(/^image\//);
  });

  test("should: load optimized images in landing page", async ({ page }) => {
    await page.goto("/");

    // Wait for hero images to load
    const lightImage = page.locator('img[alt*="light"]').first();
    await expect(lightImage).toBeVisible();

    // Check that image src uses optimization endpoint
    const src = await lightImage.getAttribute("src");
    expect(src).toContain("/resources/images");

    // Decode URL and check src parameter
    const decodedSrc = decodeURIComponent(src || "");
    expect(decodedSrc).toContain("src=/images/");

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

    // Verify srcset contains multiple responsive sizes
    expect(srcset).toContain("640w");
    expect(srcset).toContain("1200w");

    // Decode and verify it uses optimization endpoint
    const decodedSrcset = decodeURIComponent(srcset || "");
    expect(decodedSrcset).toContain("/resources/images");
    expect(decodedSrcset).toContain("src=/images/");
  });

  test("should: load all visible images on landing page without errors", async ({
    page,
  }) => {
    await page.goto("/");

    // Get all visible img elements on the landing page
    const images = await page.locator("img:visible").all();
    expect(images.length).toBeGreaterThan(0);

    // Check each visible image loaded successfully
    for (const img of images) {
      await expect(img).toBeVisible();

      // Verify image actually loaded (not broken)
      const naturalWidth = await img.evaluate(
        (element: HTMLImageElement) => element.naturalWidth,
      );
      expect(naturalWidth).toBeGreaterThan(0);

      // Verify uses optimization endpoint (except external images)
      const src = await img.getAttribute("src");
      if (src?.startsWith("/")) {
        expect(src).toContain("/resources/images");

        const decodedSrc = decodeURIComponent(src);
        expect(decodedSrc).toContain("src=/images/");
      }
    }
  });

  test("given: Supabase Storage URL from disallowed bucket, should: return 403 error", async ({
    request,
  }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const invalidBucketUrl = `${supabaseUrl}/storage/v1/object/public/unauthorized-bucket/image.jpg`;
    const optimizedUrl = `/resources/images?src=${encodeURIComponent(invalidBucketUrl)}`;

    const response = await request.get(optimizedUrl);

    expect(response.status()).toBe(403);
  });

  test("given: URL from different origin (not Supabase), should: return 403 error", async ({
    request,
  }) => {
    const externalUrl =
      "https://evil.com/storage/v1/object/public/app-images/image.jpg";
    const optimizedUrl = `/resources/images?src=${encodeURIComponent(externalUrl)}`;

    const response = await request.get(optimizedUrl);

    expect(response.status()).toBe(403);
  });
});
