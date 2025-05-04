import type { Organization, UserAccount } from '@prisma/client';
import { OrganizationMembershipRole } from '@prisma/client';
import { describe, expect, test } from 'vitest';

import { OPEN_CHECKOUT_SESSION_INTENT } from '~/features/billing/billing-constants';
import {
  createPopulatedNotification,
  createPopulatedNotificationRecipient,
} from '~/features/notifications/notifications-factories.server';
import { saveNotificationWithRecipientForUserAndOrganizationInDatabaseById } from '~/features/notifications/notifications-model.server';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { stripeHandlers } from '~/test/mocks/handlers/stripe';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { setupUserWithOrgAndAddAsMember } from '~/test/server-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import type { DataWithResponseInit } from '~/utils/http-responses.server';
import { forbidden, notFound } from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';

import { action } from './billing';

const createUrl = (organizationSlug: string) =>
  `http://localhost:3000/organizations/${organizationSlug}/settings/billing`;

async function sendAuthenticatedRequest({
  formData,
  organizationSlug,
  user,
}: {
  formData: FormData;
  organizationSlug: Organization['slug'];
  user: UserAccount;
}) {
  const request = await createAuthenticatedRequest({
    url: createUrl(organizationSlug),
    user,
    method: 'POST',
    formData,
  });

  return await action({ request, context: {}, params: { organizationSlug } });
}

setupMockServerLifecycle(...supabaseHandlers, ...stripeHandlers);

/**
 * Seed `count` notifications (each with one recipient) into the test database
 * for the given user and organization.
 */
export async function setupNotificationsForUserAndOrganization({
  user,
  organization,
  count = 1,
}: {
  user: UserAccount;
  organization: Organization;
  count?: number;
}) {
  const notifications = Array.from({ length: count }).map(() =>
    createPopulatedNotification({ organizationId: organization.id }),
  );
  const notificationsWithRecipients = await Promise.all(
    notifications.map(notification => {
      const { notificationId: _, ...recipient } =
        createPopulatedNotificationRecipient({
          notificationId: notification.id,
          userId: user.id,
          readAt: null,
        });

      return saveNotificationWithRecipientForUserAndOrganizationInDatabaseById({
        notification,
        recipient,
      });
    }),
  );

  return {
    notifications,
    recipients: notificationsWithRecipients.map(
      ({ recipients }) => recipients[0],
    ),
  };
}

describe('/organizations/:organizationSlug/settings/billing route action', () => {
  test('given: an unauthenticated request, should: throw a redirect to the login page', async () => {
    expect.assertions(2);

    const organization = createPopulatedOrganization();
    const request = new Request(createUrl(organization.slug), {
      method: 'POST',
      body: toFormData({}),
    });

    try {
      await action({
        request,
        context: {},
        params: { organizationSlug: organization.slug },
      });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/login?redirectTo=%2Forganizations%2F${organization.slug}`,
        );
      }
    }
  });

  test('given: a user who is not a member of the organization, should: return a 404', async () => {
    // Create a user with an organization.
    const { user } = await setupUserWithOrgAndAddAsMember();
    // Creates a user and another organization.
    const { organization } = await setupUserWithOrgAndAddAsMember();

    const actual = await sendAuthenticatedRequest({
      user,
      formData: toFormData({}),
      organizationSlug: organization.slug,
    });
    const expected = notFound();

    expect(actual).toEqual(expected);
  });

  describe(`${OPEN_CHECKOUT_SESSION_INTENT} intent`, () => {
    const intent = OPEN_CHECKOUT_SESSION_INTENT;

    test('given: a valid request from a member, should: return a 403', async () => {
      const { user, organization } = await setupUserWithOrgAndAddAsMember({
        role: OrganizationMembershipRole.member,
      });

      const actual = (await sendAuthenticatedRequest({
        user,
        organizationSlug: organization.slug,
        formData: toFormData({ intent, priceId: 'price_123' }),
      })) as DataWithResponseInit<object>;
      const expected = forbidden();

      expect(actual.init?.status).toEqual(expected.init?.status);
    });

    test.each([
      OrganizationMembershipRole.admin,
      OrganizationMembershipRole.owner,
    ])(
      'given: a valid request from a %s, should: return a 302 and redirect to the customer portal',
      async role => {
        const { user, organization } = await setupUserWithOrgAndAddAsMember({
          role,
        });

        const response = (await sendAuthenticatedRequest({
          user,
          organizationSlug: organization.slug,
          formData: toFormData({ intent, priceId: 'price_123' }),
        })) as Response;

        expect(response.status).toEqual(302);
        expect(response.headers.get('Location')).toMatch(
          /^https:\/\/checkout\.stripe\.com\/pay\/cs_[\dA-Za-z]+(?:\?.*)?$/,
        );
      },
    );
  });
});
