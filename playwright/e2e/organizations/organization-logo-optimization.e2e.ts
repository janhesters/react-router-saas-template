import { expect, test } from "@playwright/test";

import { setupOrganizationAndLoginAsMember } from "../../utils";
import {
  deleteOrganizationFromDatabaseById,
  updateOrganizationInDatabaseById,
} from "~/features/organizations/organizations-model.server";
import { deleteUserAccountFromDatabaseById } from "~/features/user-accounts/user-accounts-model.server";

test.describe("organization logo image optimization", () => {
  test("given: organization with Supabase Storage logo URL, should: serve optimized image through /resources/images endpoint", async ({
    page,
    request,
  }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/app-images/organization-logos/test-logo.png`;
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await updateOrganizationInDatabaseById({
      id: organization.id,
      organization: { imageUrl: logoUrl },
    });

    await page.goto("/organizations");

    const orgButton = page.getByRole("button").first();
    await expect(orgButton).toBeVisible();

    const logoImg = page.locator("img").first();
    await expect(logoImg).toBeVisible();

    const src = await logoImg.getAttribute("src");
    expect(src).toContain("/resources/images?src=");
    expect(src).toContain(encodeURIComponent(logoUrl));

    const naturalWidth = await logoImg.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);

    const optimizedUrl = `/resources/images?src=${encodeURIComponent(logoUrl)}`;
    const response = await request.get(optimizedUrl);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect(response.headers()["cache-control"]).toContain("max-age=31536000");

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: organization uploading new logo, should: show preview and then optimized URL after save", async ({
    page,
  }) => {
    const { user, organization } = await setupOrganizationAndLoginAsMember({
      page,
    });

    await page.goto(`/organizations/${organization.slug}/settings/general`);

    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles("playwright/fixtures/200x200.jpg");

    const previewImg = page.getByRole("img", { name: /logo preview/i });
    await expect(previewImg).toBeVisible();

    const previewSrc = await previewImg.getAttribute("src");
    expect(previewSrc).toMatch(/^(blob:|data:)/);

    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(
      page
        .getByRole("region", { name: /notifications/i })
        .getByText(/organization settings updated/i),
    ).toBeVisible();

    await page.reload();
    const savedLogo = page.getByRole("img", { name: /logo/i });
    await expect(savedLogo).toBeVisible();

    const savedSrc = await savedLogo.getAttribute("src");
    expect(savedSrc).toContain("/resources/images?src=");
    expect(savedSrc).toContain(encodeURIComponent("storage/v1/object/public"));

    await deleteOrganizationFromDatabaseById(organization.id);
    await deleteUserAccountFromDatabaseById(user.id);
  });
});
