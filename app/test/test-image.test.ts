import { describe, expect, test } from "vitest";

import { TEST_IMAGE_DATA_URL } from "./test-image";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";

describe("test image defaults", () => {
  test("given: default organizations and users, should: use the same embedded PNG", () => {
    const organization = createPopulatedOrganization();
    const user = createPopulatedUserAccount();

    expect(TEST_IMAGE_DATA_URL).toMatch(/^data:image\/png;base64,/);
    expect(organization.imageUrl).toEqual(TEST_IMAGE_DATA_URL);
    expect(user.imageUrl).toEqual(TEST_IMAGE_DATA_URL);
  });

  test.each(["", "https://example.com/mock-storage/avatar.png"])(
    "given: an explicit image URL of %j, should: preserve the override",
    (imageUrl) => {
      const organization = createPopulatedOrganization({ imageUrl });
      const user = createPopulatedUserAccount({ imageUrl });

      expect(organization.imageUrl).toEqual(imageUrl);
      expect(user.imageUrl).toEqual(imageUrl);
    },
  );
});
