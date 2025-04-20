import { createId } from '@paralleldrive/cuid2';
import { expect, test } from '@playwright/test';
import { mergeDeepRight } from 'ramda';

import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  mockStripeCustomerCreatedWebhookPayload,
  mockStripeCustomerSubscriptionCreatedWebhookPayload,
} from '~/test/mocks/fixtures/stripe';

import { getJson } from '../../utils';

const path = '/api/v1/stripe/webhooks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createMockStripeCustomerCreatedWebhookPayload = ({
  eventId = createId(),
  customerId = createId(),
  email = createPopulatedUserAccount().email,
}): typeof mockStripeCustomerCreatedWebhookPayload =>
  mergeDeepRight(mockStripeCustomerCreatedWebhookPayload, {
    id: eventId,
    data: { object: { id: customerId, email } },
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createMockStripeCustomerSubscriptionCreatedWebhookPayload = ({
  eventId = createId(),
  subscriptionId = createId(),
  organizationSlug = createPopulatedOrganization().slug,
  organizationId = createPopulatedOrganization().id,
  userEmail = createPopulatedUserAccount().email,
  userId = createPopulatedUserAccount().id,
} = {}): typeof mockStripeCustomerSubscriptionCreatedWebhookPayload =>
  mergeDeepRight(mockStripeCustomerSubscriptionCreatedWebhookPayload, {
    id: eventId,
    data: {
      object: {
        id: subscriptionId,
        metadata: { organizationSlug, organizationId, userEmail, userId },
      },
    },
  });

test.describe(`${path} API route`, () => {
  test('given: a GET request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.get(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test('given: a PUT request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.put(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test('given: a DELETE request, should: return a 405 error', async ({
    request,
  }) => {
    const response = await request.delete(path);

    expect(response.status()).toEqual(405);
    expect(await getJson(response)).toEqual({ message: 'Method Not Allowed' });
  });

  test.describe('POST request', () => {
    //
  });
});

// Billing:
// Pay right away from the pricing page (unauthenticated - new user)
// Pay right away from the pricing page (authenticated - existing user)

// Pricing page:
// given: an unauthenticated user that doesn't have an account, should: do nothing, just create the free-trial subscription behind the scenes for the organization when you create it.
// given: an unauthenticated user with an account who wants to pay for one of their organizations for which they are a member: shouldn't be possible
// given: an unauthenticated user with an account who wants to pay for one of their organizations for which they are an admin or owner: should be possible
// given: an unauthenticated user with an account who wants to pay for a new organization for which they are an admin or owner:
// authenticated steps are the same, just in the unauthenticated version, you need to sign in / sign up in between
// organization states:
// no free trial => start the free trial
// free trial ran out => NEED to enter CC details
// you also need to be able to enter your CC details even on free trial, if you just want to continue using the app and paying
