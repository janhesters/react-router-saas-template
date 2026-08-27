import { createId } from "@paralleldrive/cuid2";
import type { i18n } from "i18next";
import { describe, expect, onTestFinished, test } from "vitest";

import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "./organization-membership-model.server";
import {
  consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase,
  EmailInviteLinkNotConsumableError,
  retrieveEmailInviteLinkFromDatabaseById,
  saveOrganizationEmailInviteLinkToDatabase,
  updateEmailInviteLinkInDatabaseById,
} from "./organizations-email-invite-link-model.server";
import { createPopulatedOrganizationEmailInviteLink } from "./organizations-factories.server";
import { acceptEmailInvite } from "./organizations-helpers.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { setupUserWithTrialOrgAndAddAsMember } from "~/test/server-test-utils";

const testI18n = { t: (key: string) => key } as unknown as i18n;
const createRequest = () =>
  new Request("http://localhost:3000/organizations/email-invite", {
    method: "POST",
  });

async function setup() {
  const { organization, user: invitingUser } =
    await setupUserWithTrialOrgAndAddAsMember();
  const invitedUser = createPopulatedUserAccount();
  await saveUserAccountToDatabase(invitedUser);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(invitedUser.id);
  });

  const emailInviteLink = createPopulatedOrganizationEmailInviteLink({
    email: invitedUser.email,
    invitedById: invitingUser.id,
    organizationId: organization.id,
  });
  await saveOrganizationEmailInviteLinkToDatabase(emailInviteLink);

  return { emailInviteLink, invitedUser, organization };
}

describe("acceptEmailInvite()", () => {
  test("given: two concurrent requests for one invite, should: allow one acceptance and leave one membership", async () => {
    const { emailInviteLink, invitedUser, organization } = await setup();

    const results = await Promise.all([
      acceptEmailInvite({
        emailInviteToken: emailInviteLink.token,
        i18n: testI18n,
        request: createRequest(),
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
      }),
      acceptEmailInvite({
        emailInviteToken: emailInviteLink.token,
        i18n: testI18n,
        request: createRequest(),
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
      }),
    ]);

    const actual = results.filter(
      (result) => result.outcome === "accepted",
    ).length;
    const expected = 1;
    expect(actual).toEqual(expected);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: invitedUser.id },
      );
    expect(membership).toMatchObject({ role: emailInviteLink.role });

    const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      emailInviteLink.id,
    );
    expect(updatedInvite?.deactivatedAt).not.toBeNull();
  });

  test("given: a membership write failure, should: leave the invite unconsumed", async () => {
    const { emailInviteLink, organization } = await setup();
    const missingUserAccountId = createId();

    await expect(
      acceptEmailInvite({
        emailInviteToken: emailInviteLink.token,
        i18n: testI18n,
        request: createRequest(),
        userAccountId: missingUserAccountId,
        verifiedUserEmail: emailInviteLink.email,
      }),
    ).rejects.toThrow();

    const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      emailInviteLink.id,
    );
    expect(updatedInvite?.deactivatedAt).toEqual(null);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: missingUserAccountId },
      );
    expect(membership).toEqual(null);
  });

  test("given: an invite consumption failure, should: leave the membership unchanged", async () => {
    const { emailInviteLink, invitedUser, organization } = await setup();
    await updateEmailInviteLinkInDatabaseById({
      emailInviteLink: { deactivatedAt: new Date() },
      id: emailInviteLink.id,
    });

    await expect(
      consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
        emailInviteLinkId: emailInviteLink.id,
        organizationId: organization.id,
        role: emailInviteLink.role,
        userAccountId: invitedUser.id,
      }),
    ).rejects.toThrow(EmailInviteLinkNotConsumableError);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: invitedUser.id },
      );
    expect(membership).toEqual(null);
  });

  test("given: an acceptance attempt without a verified email, should: reject without changing the invite or membership", async () => {
    const { emailInviteLink, invitedUser, organization } = await setup();

    const actual = await acceptEmailInvite({
      emailInviteToken: emailInviteLink.token,
      i18n: testI18n,
      request: createRequest(),
      userAccountId: invitedUser.id,
      verifiedUserEmail: undefined,
    });
    const expected = { outcome: "rejected" };
    expect(actual).toEqual(expected);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: invitedUser.id },
      );
    expect(membership).toEqual(null);

    const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      emailInviteLink.id,
    );
    expect(updatedInvite?.deactivatedAt).toEqual(null);
  });

  test("given: an existing member and an owner invite, should: consume the invite without changing the existing role", async () => {
    const { organization, user: existingMember } =
      await setupUserWithTrialOrgAndAddAsMember();
    const emailInviteLink = createPopulatedOrganizationEmailInviteLink({
      email: existingMember.email,
      invitedById: existingMember.id,
      organizationId: organization.id,
      role: "owner",
    });
    await saveOrganizationEmailInviteLinkToDatabase(emailInviteLink);

    const actual = await acceptEmailInvite({
      emailInviteToken: emailInviteLink.token,
      i18n: testI18n,
      request: createRequest(),
      userAccountId: existingMember.id,
      verifiedUserEmail: existingMember.email,
    });
    const expected = "alreadyMember";
    expect(actual.outcome).toEqual(expected);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: existingMember.id },
      );
    expect(membership?.role).toEqual("member");

    const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      emailInviteLink.id,
    );
    expect(updatedInvite?.deactivatedAt).not.toBeNull();
  });
});
