import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";

import type { UserAccount } from "~/generated/client";
import { TEST_IMAGE_DATA_URL } from "~/test/test-image";
import type { Factory } from "~/utils/types";

/**
 * Creates a user account with populated values.
 *
 * @param userAccountParams - User account params to create user account with.
 * @returns A populated user account with given params.
 */
export const createPopulatedUserAccount: Factory<UserAccount> = ({
  updatedAt = faker.date.recent({ days: 10 }),
  createdAt = faker.date.past({ refDate: updatedAt, years: 3 }),
  email = `user-${createId()}@example.com`,
  id = createId(),
  imageUrl = TEST_IMAGE_DATA_URL,
  name = faker.person.fullName(),
  supabaseUserId = faker.string.uuid(),
} = {}) => ({
  createdAt,
  email,
  id,
  imageUrl,
  name,
  supabaseUserId,
  updatedAt,
});
