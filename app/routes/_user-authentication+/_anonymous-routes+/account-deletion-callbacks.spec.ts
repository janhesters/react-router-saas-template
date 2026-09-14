import { randomUUID } from "node:crypto";
import { describe, expect, onTestFinished, test, vi } from "vitest";

import { loader as oauthCallback } from "./auth.callback";
import { loader as loginConfirmation } from "./login.confirm";
import { loader as registrationConfirmation } from "./register.confirm";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { createSupabaseServerClient } from "~/features/user-authentication/supabase.server";
import {
  createPopulatedSupabaseSession,
  createPopulatedSupabaseUser,
} from "~/features/user-authentication/user-authentication-factories";
import { anonymousContext } from "~/features/user-authentication/user-authentication-middleware.server";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import { createTestContextProvider } from "~/test/test-utils";
import { prisma } from "~/utils/database.server";

setupMockServerLifecycle(...supabaseHandlers);

describe("deleted account authentication callbacks", () => {
  test.each([
    { loader: oauthCallback, pattern: "/auth/callback" },
    { loader: loginConfirmation, pattern: "/login/confirm" },
    { loader: registrationConfirmation, pattern: "/register/confirm" },
  ])(
    "given: a deleted identity callback at $pattern and a new account with the same email, should: reject the old identity before using the new account",
    async ({ loader, pattern }) => {
      const deleted = createPopulatedUserAccount();
      const replacement = createPopulatedUserAccount({ email: deleted.email });
      onTestFinished(async () => {
        vi.restoreAllMocks();
        await prisma.userAccount.deleteMany({
          where: { email: deleted.email },
        });
        await prisma.accountDeletion.deleteMany({
          where: { id: deleted.id },
        });
      });
      await prisma.accountDeletion.create({
        data: {
          id: deleted.id,
          recoveryTokenHash: randomUUID(),
          supabaseUserId: deleted.supabaseUserId,
        },
      });
      await prisma.userAccount.create({ data: replacement });
      const request = new Request(
        `http://localhost:3000${pattern}?code=test-code&token_hash=test-token`,
      );
      const context = await createTestContextProvider({
        params: {},
        pattern,
        request,
      });
      const { supabase } = createSupabaseServerClient({ request });
      const user = createPopulatedSupabaseUser({
        email: deleted.email,
        id: deleted.supabaseUserId,
      });
      const session = createPopulatedSupabaseSession({ user });
      vi.spyOn(supabase.auth, "verifyOtp").mockResolvedValue({
        data: { session, user },
        error: null,
      });
      vi.spyOn(supabase.auth, "exchangeCodeForSession").mockResolvedValue({
        data: { session, user },
        error: null,
      });
      context.set(anonymousContext, { supabase });

      await expect(
        loader({
          context,
          params: {},
          pattern,
          request,
          url: new URL(request.url),
        }),
      ).rejects.toMatchObject({ status: 410 });
      expect(
        await prisma.userAccount.findUnique({
          where: { id: replacement.id },
        }),
      ).toEqual(replacement);
    },
  );
});
