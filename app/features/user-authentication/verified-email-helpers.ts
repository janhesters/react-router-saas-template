import type { User } from "@supabase/supabase-js";

import { normalizeEmailAddress } from "~/utils/normalize-email-address";

/**
 * Returns the authenticated user's normalized email only when Supabase marks
 * it as verified.
 *
 * `email_confirmed_at` is intentionally the only accepted verification
 * signal. Supabase's `confirmed_at` can represent phone confirmation, while
 * `user_metadata` is editable by the user and is unsafe for authorization.
 */
export function getVerifiedUserEmail(user: User): string | undefined {
  if (!user.email) {
    return undefined;
  }

  return user.email_confirmed_at
    ? normalizeEmailAddress(user.email)
    : undefined;
}
