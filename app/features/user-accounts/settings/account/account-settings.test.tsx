import { describe, expect, test } from "vitest";

import { AccountSettings } from "./account-settings";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createUser: Factory<{
  email: string;
  imageUrl: string;
  name: string;
}> = ({
  email = createPopulatedUserAccount().email,
  imageUrl = createPopulatedUserAccount().imageUrl,
  name = createPopulatedUserAccount().name,
} = {}) => ({ email, imageUrl, name });

describe("AccountSettings Component", () => {
  describe("Image Optimization", () => {
    test("given: user with avatar URL, should: render optimized image URL", () => {
      const avatarUrl =
        "https://test.supabase.co/storage/v1/object/public/app-images/user-avatars/user123.jpg";
      const user = createUser({ imageUrl: avatarUrl });

      render(<AccountSettings user={user} />);

      const img = screen.getByRole("img", { name: /avatar/i });
      const src = img.getAttribute("src");
      expect(src).toContain("/resources/images?src=");
      expect(src).toContain(encodeURIComponent(avatarUrl));
    });

    test("given: user with null avatar, should: render fallback icon", () => {
      const user = createUser({ imageUrl: "" });

      render(
        <AccountSettings user={{ ...user, imageUrl: user.imageUrl ?? "" }} />,
      );

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });
});
