import { AuthApiError } from "@supabase/supabase-js";
import { afterEach, describe, expect, test, vi } from "vitest";

import { accountSettingsAction } from "./account-settings-action.server";
import { DELETE_USER_ACCOUNT_INTENT } from "./account-settings-constants";
import * as deletion from "~/features/user-accounts/deletion/account-deletion.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import * as accountHelpers from "~/features/user-accounts/user-accounts-helpers.server";
import { supabaseAdminClient } from "~/features/user-authentication/supabase.server";
import { createTestContextProvider } from "~/test/test-utils";
import { toFormData } from "~/utils/to-form-data";

afterEach(() => vi.restoreAllMocks());

async function setup() {
  const user = { ...createPopulatedUserAccount(), memberships: [] };
  vi.spyOn(
    accountHelpers,
    "requireAuthenticatedUserWithMembershipsAndSubscriptionsExists",
  ).mockResolvedValue({ supabase: supabaseAdminClient, user });
  const admission = vi
    .spyOn(deletion, "requestAccountDeletion")
    .mockResolvedValue({
      deletion: {
        attempts: 0,
        completedAt: null,
        createdAt: new Date(),
        id: user.id,
        lastError: null,
        leaseExpiresAt: null,
        leaseToken: null,
        nextAttemptAt: new Date(),
        recoveryTokenHash: "hash",
        supabaseUserId: user.supabaseUserId,
      },
      recoveryToken: "opaque-recovery-token",
    });
  const signOut = vi
    .spyOn(supabaseAdminClient.auth, "signOut")
    .mockResolvedValue({ error: null });
  const deleteAuthUser = vi.spyOn(supabaseAdminClient.auth.admin, "deleteUser");
  const request = new Request("http://localhost:3000/settings/account", {
    body: toFormData({
      confirmation: user.email,
      intent: DELETE_USER_ACCOUNT_INTENT,
    }),
    method: "POST",
  });
  const params = {};
  const pattern = "/settings/account";
  const context = await createTestContextProvider({ params, pattern, request });
  const run = () =>
    accountSettingsAction({
      context,
      params,
      pattern,
      request,
      url: new URL(request.url),
    });
  return { admission, deleteAuthUser, run, signOut, user };
}

describe("account deletion response boundaries", () => {
  test("given: admission fails before commit, should: preserve the session and not call Auth deletion", async () => {
    const { admission, signOut, deleteAuthUser, run } = await setup();
    const error = new Error("Database unavailable");
    admission.mockRejectedValue(error);
    await expect(run()).rejects.toEqual(error);
    expect(signOut).not.toHaveBeenCalled();
    expect(deleteAuthUser).not.toHaveBeenCalled();
  });

  test.each(["confirmationMismatch", "ownershipRequired"] as const)(
    "given: admission rejects %s, should: show a form error without signing out",
    async (code) => {
      const { admission, signOut, run } = await setup();
      admission.mockRejectedValue(new deletion.AccountDeletionError(code));
      const result = await run();
      expect(result).toMatchObject({ init: { status: 400 } });
      expect(signOut).not.toHaveBeenCalled();
    },
  );

  test.each(["throw", "API error"] as const)(
    "given: sign-out fails with %s after admission, should: return recovery for the committed deletion",
    async (failure) => {
      const { admission, signOut, deleteAuthUser, run, user } = await setup();
      const error = new AuthApiError(
        "Sign-out failed",
        500,
        "unexpected_failure",
      );
      if (failure === "throw") signOut.mockRejectedValue(error);
      else signOut.mockResolvedValue({ error });
      const result = (await run()) as Response;
      expect(result.status).toEqual(302);
      expect(result.headers.get("Location")).toEqual(
        `/account-deletions/${user.id}`,
      );
      expect(result.headers.get("Set-Cookie")).toContain("HttpOnly");
      expect(admission).toHaveBeenCalledExactlyOnceWith({
        confirmation: user.email,
        userId: user.id,
      });
      expect(deleteAuthUser).not.toHaveBeenCalled();
    },
  );
});
