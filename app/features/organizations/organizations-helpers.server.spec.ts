import { createId } from "@paralleldrive/cuid2";
import type { i18n } from "i18next";
import { describe, expect, onTestFinished, test } from "vitest";

import { retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId } from "./organization-membership-model.server";
import {
  consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase,
  EmailInviteLinkEmailMismatchError,
  EmailInviteLinkNotConsumableError,
  EmailInviteLinkOrganizationFullError,
  retrieveEmailInviteLinkFromDatabaseById,
  saveOrganizationEmailInviteLinkToDatabase,
  updateEmailInviteLinkInDatabaseById,
} from "./organizations-email-invite-link-model.server";
import { createPopulatedOrganizationEmailInviteLink } from "./organizations-factories.server";
import { acceptEmailInvite } from "./organizations-helpers.server";
import { priceLookupKeysByTierAndInterval } from "~/features/billing/billing-constants";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  setupUserWithOrgAndAddAsMember,
  setupUserWithTrialOrgAndAddAsMember,
} from "~/test/server-test-utils";

const testI18n = { t: (key: string) => key } as unknown as i18n;
const server = setupMockServerLifecycle(...stripeHandlers);
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

    const actual = results.map((result) => result.outcome).sort();
    const expected = ["accepted", "rejected"];
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

  test("given: two concurrent requests for a subscribed organization, should: adjust Stripe seats once with the committed membership count", async () => {
    const { organization, user: invitingUser } =
      await setupUserWithOrgAndAddAsMember();
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

    let stripeSeatUpdateCount = 0;
    let stripeSeatUpdateBody: Promise<string> | undefined;
    const captureStripeSeatUpdateBody = ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      if (
        request.method === "POST" &&
        /^\/v1\/subscriptions\/[^/]+$/.test(url.pathname)
      ) {
        stripeSeatUpdateBody = request.clone().text();
      }
    };
    const countStripeSeatUpdate = ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      if (
        request.method === "POST" &&
        /^\/v1\/subscriptions\/[^/]+$/.test(url.pathname)
      ) {
        stripeSeatUpdateCount += 1;
      }
    };
    server.events.on("request:start", captureStripeSeatUpdateBody);
    server.events.on("response:mocked", countStripeSeatUpdate);
    onTestFinished(() => {
      server.events.removeListener(
        "request:start",
        captureStripeSeatUpdateBody,
      );
      server.events.removeListener("response:mocked", countStripeSeatUpdate);
    });

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

    const actualOutcomes = results.map((result) => result.outcome).sort();
    const expectedOutcomes = ["accepted", "rejected"];
    expect(actualOutcomes).toEqual(expectedOutcomes);
    expect(stripeSeatUpdateCount).toEqual(1);

    const stripeSeatUpdateParameters = new URLSearchParams(
      await stripeSeatUpdateBody,
    );
    const actualQuantity = stripeSeatUpdateParameters.get("items[0][quantity]");
    const expectedQuantity = "2";
    expect(actualQuantity).toEqual(expectedQuantity);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: invitedUser.id },
      );
    expect(membership).toMatchObject({ role: emailInviteLink.role });
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
        emailInviteToken: emailInviteLink.token,
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
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

  test("given: two concurrent attempts by an existing member, should: claim once and preserve the existing role", async () => {
    const { organization, user: existingMember } =
      await setupUserWithTrialOrgAndAddAsMember();
    const emailInviteLink = createPopulatedOrganizationEmailInviteLink({
      email: existingMember.email,
      invitedById: existingMember.id,
      organizationId: organization.id,
      role: "owner",
    });
    await saveOrganizationEmailInviteLinkToDatabase(emailInviteLink);

    const results = await Promise.all([
      acceptEmailInvite({
        emailInviteToken: emailInviteLink.token,
        i18n: testI18n,
        request: createRequest(),
        userAccountId: existingMember.id,
        verifiedUserEmail: existingMember.email,
      }),
      acceptEmailInvite({
        emailInviteToken: emailInviteLink.token,
        i18n: testI18n,
        request: createRequest(),
        userAccountId: existingMember.id,
        verifiedUserEmail: existingMember.email,
      }),
    ]);

    const actual = results.map((result) => result.outcome).sort();
    const expected = ["alreadyMember", "rejected"];
    expect(actual).toEqual(expected);

    const membership =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        { organizationId: organization.id, userId: existingMember.id },
      );
    expect(membership).toMatchObject({ role: "member" });

    const updatedInvite = await retrieveEmailInviteLinkFromDatabaseById(
      emailInviteLink.id,
    );
    expect(updatedInvite?.deactivatedAt).not.toBeNull();
  });

  test("given: an invite whose organization and role change before claim, should: derive membership from the claimed row", async () => {
    const {
      emailInviteLink,
      invitedUser,
      organization: originalOrganization,
    } = await setup();
    const { organization: currentOrganization } =
      await setupUserWithTrialOrgAndAddAsMember();
    await updateEmailInviteLinkInDatabaseById({
      emailInviteLink: {
        organizationId: currentOrganization.id,
        role: "owner",
      },
      id: emailInviteLink.id,
    });

    const result =
      await consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
        emailInviteToken: emailInviteLink.token,
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
      });
    expect(result).toMatchObject({
      organization: { id: currentOrganization.id },
      outcome: "accepted",
      role: "owner",
    });

    const membershipInCurrentOrganization =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        {
          organizationId: currentOrganization.id,
          userId: invitedUser.id,
        },
      );
    expect(membershipInCurrentOrganization).toMatchObject({ role: "owner" });

    const membershipInOriginalOrganization =
      await retrieveOrganizationMembershipFromDatabaseByUserIdAndOrganizationId(
        {
          organizationId: originalOrganization.id,
          userId: invitedUser.id,
        },
      );
    expect(membershipInOriginalOrganization).toEqual(null);
  });

  test("given: an invite whose email changes before claim, should: compare the verified identity with the claimed row and roll back", async () => {
    const { emailInviteLink, invitedUser, organization } = await setup();
    await updateEmailInviteLinkInDatabaseById({
      emailInviteLink: { email: "new-recipient@example.com" },
      id: emailInviteLink.id,
    });

    await expect(
      consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
        emailInviteToken: emailInviteLink.token,
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
      }),
    ).rejects.toThrow(EmailInviteLinkEmailMismatchError);

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

  test("given: an organization at its seat limit, should: roll back the invite claim and membership", async () => {
    const { organization, user: invitingUser } =
      await setupUserWithOrgAndAddAsMember({
        lookupKey: priceLookupKeysByTierAndInterval.low.annual,
      });
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

    await expect(
      consumeEmailInviteLinkAndAddMemberToOrganizationInDatabase({
        emailInviteToken: emailInviteLink.token,
        userAccountId: invitedUser.id,
        verifiedUserEmail: invitedUser.email,
      }),
    ).rejects.toThrow(EmailInviteLinkOrganizationFullError);

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
});
