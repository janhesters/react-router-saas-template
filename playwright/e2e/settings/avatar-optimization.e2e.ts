import { expect, test } from "@playwright/test";

import { loginAndSaveUserAccountToDatabase } from "../../utils";
import {
  deleteUserAccountFromDatabaseById,
  updateUserAccountInDatabaseById,
} from "~/features/user-accounts/user-accounts-model.server";

test.describe("avatar image optimization", () => {
  test("given: user with Supabase Storage avatar URL, should: serve optimized image through /resources/images endpoint", async ({
    page,
    request,
  }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/app-images/user-avatars/test-avatar.jpg`;
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await updateUserAccountInDatabaseById({
      id: user.id,
      user: { imageUrl: avatarUrl },
    });

    await page.goto("/settings/account");

    const avatarImg = page.getByRole("img", { name: /avatar/i });
    await expect(avatarImg).toBeVisible();

    const src = await avatarImg.getAttribute("src");
    expect(src).toContain("/resources/images?src=");
    expect(src).toContain(encodeURIComponent(avatarUrl));

    const naturalWidth = await avatarImg.evaluate(
      (img: HTMLImageElement) => img.naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);

    const optimizedUrl = `/resources/images?src=${encodeURIComponent(avatarUrl)}`;
    const response = await request.get(optimizedUrl);

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect(response.headers()["cache-control"]).toContain("max-age=31536000");

    await deleteUserAccountFromDatabaseById(user.id);
  });

  test("given: user uploading new avatar, should: show preview and then optimized URL after save", async ({
    page,
  }) => {
    const user = await loginAndSaveUserAccountToDatabase({ page });

    await page.goto("/settings/account");

    await expect(
      page.getByRole("heading", { level: 1, name: /settings/i }),
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("playwright/fixtures/200x200.jpg");

    const previewImg = page.getByRole("img", { name: /avatar preview/i });
    await expect(previewImg).toBeVisible();

    const previewSrc = await previewImg.getAttribute("src");
    expect(previewSrc).toMatch(/^(blob:|data:)/);

    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(
      page
        .getByRole("region", { name: /notifications/i })
        .getByText(/your account has been updated/i),
    ).toBeVisible();

    await page.reload();
    const savedAvatar = page.getByRole("img", { name: /avatar/i });
    await expect(savedAvatar).toBeVisible();

    const savedSrc = await savedAvatar.getAttribute("src");
    expect(savedSrc).toContain("/resources/images?src=");
    expect(savedSrc).toContain(encodeURIComponent("storage/v1/object/public"));

    await deleteUserAccountFromDatabaseById(user.id);
  });
});
