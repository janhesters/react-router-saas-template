import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import type { Session, User } from "@supabase/supabase-js";

import type { Factory } from "~/utils/types";

/**
 * Creates a populated Supabase user with default values.
 *
 * @param userParams - User params to create Supabase user with.
 * @returns A populated Supabase user with given params.
 */
export const createPopulatedSupabaseUser: Factory<User> = ({
  app_metadata = {},
  aud = "authenticated",
  updated_at = faker.date.recent({ days: 10 }).toISOString(),
  confirmed_at = faker.date
    .past({ refDate: updated_at, years: 0.9 })
    .toISOString(),
  created_at = faker.date.past({ refDate: updated_at, years: 1 }).toISOString(),
  email = `user-${createId()}@example.com`,
  email_confirmed_at = confirmed_at,
  factors,
  id = faker.string.uuid(),
  last_sign_in_at = faker.date
    .recent({ days: 5, refDate: updated_at })
    .toISOString(),
  phone,
  phone_confirmed_at,
  role = "authenticated",
  user_metadata = {},
} = {}) => ({
  app_metadata,
  aud,
  confirmed_at,
  created_at,
  email,
  email_confirmed_at,
  factors,
  id,
  last_sign_in_at,
  phone,
  phone_confirmed_at,
  role,
  updated_at,
  user_metadata,
});

/**
 * Creates a populated Supabase session with default values.
 *
 * @param sessionParams - Session params to create Supabase session with.
 * @returns A populated Supabase session with given params.
 */
export const createPopulatedSupabaseSession: Factory<Session> = ({
  access_token = `access_token_${createId()}`,
  expires_at = Math.floor(Date.now() / 1000) + 3600,
  expires_in = 3600,
  refresh_token = `refresh_token_${createId()}`,
  token_type = "bearer",
  user = createPopulatedSupabaseUser(),
} = {}) => ({
  access_token,
  expires_at,
  expires_in,
  refresh_token,
  token_type,
  user,
});
