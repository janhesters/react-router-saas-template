/** biome-ignore-all lint/style/noNonNullAssertion: test code */
import type { Organization, UserAccount } from "@prisma/client";
import { OrganizationMembershipRole } from "@prisma/client";
import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./billing";
import {
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  OPEN_CHECKOUT_SESSION_INTENT,
  priceLookupKeysByTierAndInterval,
  RESUME_SUBSCRIPTION_INTENT,
  SWITCH_SUBSCRIPTION_INTENT,
  UPDATE_BILLING_EMAIL_INTENT,
  VIEW_INVOICES_INTENT,
} from "~/features/billing/billing-constants";
import {
  createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice,
  createPopulatedStripeSubscriptionWithItemsAndPrice,
  getRandomLookupKey,
} from "~/features/billing/billing-factories.server";
import { retrieveStripePriceFromDatabaseByLookupKey } from "~/features/billing/stripe-prices-model.server";
import { retrieveStripeSubscriptionFromDatabaseById } from "~/features/billing/stripe-subscription-model.server";
import {
  retrieveStripeSubscriptionScheduleFromDatabaseById,
  saveSubscriptionScheduleWithPhasesAndPriceToDatabase,
} from "~/features/billing/stripe-subscription-schedule-model.server";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import { addMembersToOrganizationInDatabaseById } from "~/features/organizations/organizations-model.server";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { stripeHandlers } from "~/test/mocks/handlers/stripe";
import { supabaseHandlers } from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  setupUserWithOrgAndAddAsMember,
  setupUserWithTrialOrgAndAddAsMember,
} from "~/test/server-test-utils";
import {
  createAuthenticatedRequest,
  createOrganizationMembershipTestContextProvider,
} from "~/test/test-utils";
import type { DataWithResponseInit } from "~/utils/http-responses.server";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "~/utils/http-responses.server";
import { toFormData } from "~/utils/to-form-data";

const createUrl = (organizationSlug: string) =>
  `http://localhost:3000/organizations/${organizationSlug}/settings/billing`;

const pattern = "/organizations/:organizationSlug/settings/billing";

async function sendAuthenticatedRequest({
  formData,
  organizationSlug,
  user,
}: {
  formData: FormData;
  organizationSlug: Organization["slug"];
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    formData,
    method: "POST",
    url: createUrl(organizationSlug),
    user,
  });
  const params = { organizationSlug };

  return await action({
    context: await createOrganizationMembershipTestContextProvider({
      params,
      pattern,
      request,
    }),
    params,
    request,
    unstable_pattern: pattern,
  });
}

const server = setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

describe("/organizations/:organizationSlug/settings/billing route action", () => {
  test("given: an unauthenticated request, should: throw a redirect to the login page", async () => {
    expect.assertions(2);

    const organization = createPopulatedOrganization();
    const request = new Request(createUrl(organization.slug), {
      body: toFormData({}),
      method: "POST",
    });
    const params = { organizationSlug: organization.slug };

    try {
      await action({
        context: await createOrganizationMembershipTestContextProvider({
          params,
          pattern,
          request,
        }),
        params,
        request,
        unstable_pattern: pattern,
      });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual(
          `/login?redirectTo=%2Forganizations%2F${organization.slug}%2Fsettings%2Fbilling`,
        );
      }
    }
  });

  test("given: a user who is not a member of the organization, should: throw a 404", async () => {
    expect.assertions(1);
    // Create a user with an organization.
    const { user } = await setupUserWithOrgAndAddAsMember();
    // Creates a user and another organization.
    const { organization } = await setupUserWithOrgAndAddAsMember();

    try {
      await sendAuthenticatedRequest({
        formData: toFormData({}),
        organizationSlug: organization.slug,
        user,
      });
    } catch (error) {
      const expected = notFound();

      expect(error).toEqual(expected);
    }
  });

  describe(`${CANCEL_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = CANCEL_SUBSCRIPTION_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, should: return a 302 and redirect to the customer portal",
      async (role) => {
        // listen for the Stripe "cancel subscription" POST
        let stripeCancelCalled = false;
        const cancelListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/billing_portal/sessions") {
            stripeCancelCalled = true;
          }
        };
        server.events.on("response:mocked", cancelListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", cancelListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        })) as Response;

        expect(actual.status).toEqual(302);
        expect(actual.headers.get("Location")).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(stripeCancelCalled).toEqual(true);
      },
    );
  });

  describe(`${KEEP_CURRENT_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = KEEP_CURRENT_SUBSCRIPTION_INTENT;

    test("given: a member role, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;

      expect(actual.init?.status).toEqual(forbidden().init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a %s role without pending schedule, should: return a 200 and NOT call the release endpoint",
      async (role) => {
        let releaseCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            /^\/v1\/subscription_schedules\/.+\/release$/.test(
              new URL(request.url).pathname,
            )
          ) {
            releaseCalled = true;
          }
        };
        server.events.on("response:mocked", listener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", listener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(releaseCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a %s role with pending schedule, should: return a 200, call the release endpoint and delete the schedule from the database",
      async (role) => {
        let releaseCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            /^\/v1\/subscription_schedules\/.+\/release$/.test(
              new URL(request.url).pathname,
            )
          ) {
            releaseCalled = true;
          }
        };
        server.events.on("response:mocked", listener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", listener);
        });

        const { user, organization, subscription } =
          await setupUserWithOrgAndAddAsMember({
            lookupKey: priceLookupKeysByTierAndInterval.mid.monthly,
            role,
          });
        const price = await retrieveStripePriceFromDatabaseByLookupKey(
          priceLookupKeysByTierAndInterval.low.monthly,
        );
        const subscriptionSchedule =
          createPopulatedStripeSubscriptionScheduleWithPhasesAndPrice({
            phases: [{ price: price! }],
            subscriptionId: subscription.stripeId,
          });
        await saveSubscriptionScheduleWithPhasesAndPriceToDatabase(
          subscriptionSchedule,
        );

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(releaseCalled).toEqual(true);
        const schedule =
          await retrieveStripeSubscriptionScheduleFromDatabaseById(
            subscriptionSchedule.stripeId,
          );
        expect(schedule).toEqual(null);
      },
    );
  });

  describe(`${OPEN_CHECKOUT_SESSION_INTENT} intent`, () => {
    const intent = OPEN_CHECKOUT_SESSION_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithTrialOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, should: return a 302 and redirect to the customer portal",
      async (role) => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/checkout/sessions") {
            checkoutSessionCalled = true;
          }
        };
        server.events.on("response:mocked", checkoutListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", checkoutListener);
        });

        const { user, organization } =
          await setupUserWithTrialOrgAndAddAsMember({ role });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
          organizationSlug: organization.slug,
          user,
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get("Location")).toMatch(
          /^https:\/\/checkout\.stripe\.com\/pay\/cs_[\dA-Za-z]+(?:\?.*)?$/,
        );
        expect(checkoutSessionCalled).toEqual(true);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, but their organization has too many members for the chosen plan, should: return a 409",
      async (role) => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/checkout/sessions") {
            checkoutSessionCalled = true;
          }
        };
        server.events.on("response:mocked", checkoutListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", checkoutListener);
        });

        const { user, organization } =
          await setupUserWithTrialOrgAndAddAsMember({ role });
        const otherUser = createPopulatedUserAccount();
        await saveUserAccountToDatabase(otherUser);
        await addMembersToOrganizationInDatabaseById({
          id: organization.id,
          members: [otherUser.id],
        });
        onTestFinished(async () => {
          await deleteUserAccountFromDatabaseById(otherUser.id);
        });

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<{ message: string }>;
        const expected = conflict();

        expect(actual).toEqual(expected);
        expect(checkoutSessionCalled).toEqual(false);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, but their organization already has a subscription, should: return a 409",
      async (role) => {
        let checkoutSessionCalled = false;
        const checkoutListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/checkout/sessions") {
            checkoutSessionCalled = true;
          }
        };
        server.events.on("response:mocked", checkoutListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", checkoutListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<{ message: string }>;
        const expected = conflict();

        expect(actual).toEqual(expected);
        expect(checkoutSessionCalled).toEqual(false);
      },
    );
  });

  describe(`${RESUME_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = RESUME_SUBSCRIPTION_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s and a subscription that is set to cancel at period end, should: return a 200 and call the update endpoint and update the subscription in the database",
      async (role) => {
        let resumeCalled = false;
        const listener = ({ request }: { request: Request }) => {
          if (
            new URL(request.url).pathname ===
            `/v1/subscriptions/${subscription.stripeId}`
          ) {
            resumeCalled = true;
          }
        };
        server.events.on("response:mocked", listener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", listener);
        });

        const { user, organization, subscription } =
          await setupUserWithOrgAndAddAsMember({
            role,
            subscription: createPopulatedStripeSubscriptionWithItemsAndPrice({
              cancelAtPeriodEnd: true,
            }),
          });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(resumeCalled).toEqual(true);

        const updatedSubscription =
          await retrieveStripeSubscriptionFromDatabaseById(
            subscription.stripeId,
          );
        expect(updatedSubscription?.cancelAtPeriodEnd).toEqual(false);
      },
    );
  });

  describe(`${SWITCH_SUBSCRIPTION_INTENT} intent`, () => {
    const intent = SWITCH_SUBSCRIPTION_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent, lookupKey: getRandomLookupKey() }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      {
        data: {},
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                lookupKey: [
                  "Invalid input: expected string, received undefined",
                ],
              },
            },
          },
        }),
      },
    ])(
      "given: invalid data $data, should: return validation errors",
      async ({ data, expected }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({ intent, ...data }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(actual).toMatchObject(expected);
      },
    );

    test("given: an invalid lookup key, should: return a bad request", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.admin,
      });

      const response = (await sendAuthenticatedRequest({
        formData: toFormData({
          intent,
          lookupKey: "invalid_lookup_key",
        }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;

      expect(response.init?.status).toEqual(400);
      expect(response.data).toEqual({ message: "Price not found" });
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, should: return a 302 and redirect to the customer portal",
      async (role) => {
        let switchSessionCalled = false;
        const switchListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/billing_portal/sessions") {
            switchSessionCalled = true;
          }
        };
        server.events.on("response:mocked", switchListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", switchListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          lookupKey: getRandomLookupKey(),
          role,
        });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({
            intent,
            lookupKey: priceLookupKeysByTierAndInterval.low.monthly,
          }),
          organizationSlug: organization.slug,
          user,
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get("Location")).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(switchSessionCalled).toEqual(true);
      },
    );
  });

  describe(`${UPDATE_BILLING_EMAIL_INTENT} intent`, () => {
    const intent = UPDATE_BILLING_EMAIL_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ billingEmail: "new@example.com", intent }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      {
        data: {},
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                billingEmail: [
                  "billing:billingPage.updateBillingEmailModal.emailInvalid",
                ],
              },
            },
          },
        }),
      },
      {
        data: { billingEmail: "not-an-email" },
        expected: badRequest({
          result: {
            error: {
              fieldErrors: {
                billingEmail: [
                  "billing:billingPage.updateBillingEmailModal.emailInvalid",
                ],
              },
            },
          },
        }),
      },
    ])(
      "given: invalid data $data, should: return validation errors",
      async ({ data, expected }) => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role: OrganizationMembershipRole.admin,
        });

        const actual = (await sendAuthenticatedRequest({
          formData: toFormData({ intent, ...data }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(actual).toMatchObject(expected);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s with a new email, should: update the billing email and return a 200",
      async (role) => {
        let updateCustomerCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/customers")) {
            updateCustomerCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          organization: createPopulatedOrganization({
            billingEmail: "old@example.com",
          }),
          role,
        });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({
            billingEmail: "new@example.com",
            intent,
          }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(updateCustomerCalled).toEqual(true);
      },
    );

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s with the same email, should: skip the update and return a 200",
      async (role) => {
        let updateCustomerCalled = false;
        const updateListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname.startsWith("/v1/customers")) {
            updateCustomerCalled = true;
          }
        };
        server.events.on("response:mocked", updateListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", updateListener);
        });

        const currentEmail = "same@example.com";
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          organization: createPopulatedOrganization({
            billingEmail: currentEmail,
          }),
          role,
        });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({
            billingEmail: currentEmail,
            intent,
          }),
          organizationSlug: organization.slug,
          user,
        })) as DataWithResponseInit<object>;

        expect(response.data).toEqual({});
        expect(updateCustomerCalled).toEqual(false);
      },
    );
  });

  describe(`${VIEW_INVOICES_INTENT} intent`, () => {
    const intent = VIEW_INVOICES_INTENT;

    test("given: a valid request from a member, should: return a 403", async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        formData: toFormData({ intent }),
        organizationSlug: organization.slug,
        user,
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      "given: a valid request from a %s, should: return a 302 and redirect to the customer portal",
      async (role) => {
        let portalSessionCalled = false;
        const portalListener = ({ request }: { request: Request }) => {
          if (new URL(request.url).pathname === "/v1/billing_portal/sessions") {
            portalSessionCalled = true;
          }
        };
        server.events.on("response:mocked", portalListener);
        onTestFinished(() => {
          server.events.removeListener("response:mocked", portalListener);
        });

        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const response = (await sendAuthenticatedRequest({
          formData: toFormData({ intent }),
          organizationSlug: organization.slug,
          user,
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get("Location")).toMatch(
          /^https:\/\/billing\.stripe\.com\/p\/session\/\w+(?:\?.*)?$/,
        );
        expect(portalSessionCalled).toEqual(true);
      },
    );
  });
});
