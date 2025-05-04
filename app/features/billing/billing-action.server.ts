import { OrganizationMembershipRole } from '@prisma/client';
import { redirect } from 'react-router';
import { z } from 'zod';

import { getIsDataWithResponseInit } from '~/utils/get-is-data-with-response-init.server';
import { requestToUrl } from '~/utils/get-search-parameter-from-request.server';
import { forbidden } from '~/utils/http-responses.server';
import { validateFormData } from '~/utils/validate-form-data.server';

import type { Route } from '../../routes/organizations_+/$organizationSlug+/settings+/+types/billing';
import { requireUserIsMemberOfOrganization } from '../organizations/organizations-helpers.server';
import {
  OPEN_CHECKOUT_SESSION_INTENT,
  OPEN_CUSTOMER_PORTAL_INTENT,
} from './billing-constants';
import { extractBaseUrl } from './billing-helpers.server';
import {
  openCustomerCheckoutSessionSchema,
  openCustomerPortalSchema,
} from './billing-schemas';
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
} from './stripe-helpers.server';

const schema = z.discriminatedUnion('intent', [
  openCustomerPortalSchema,
  openCustomerCheckoutSessionSchema,
]);

export async function billingAction({ request, params }: Route.ActionArgs) {
  try {
    const { user, organization, role } =
      await requireUserIsMemberOfOrganization(request, params.organizationSlug);
    const body = await validateFormData(request, schema);

    switch (body.intent) {
      case OPEN_CUSTOMER_PORTAL_INTENT: {
        const portalSession = await createStripeCustomerPortalSession({
          baseUrl: request.url,
          customerId: '', // USER_ID
          organizationSlug: params.organizationSlug,
        });

        return redirect(portalSession.url);
      }

      case OPEN_CHECKOUT_SESSION_INTENT: {
        if (role === OrganizationMembershipRole.member) {
          return forbidden();
        }

        const baseUrl = extractBaseUrl(requestToUrl(request));

        const checkoutSession = await createStripeCheckoutSession({
          baseUrl,
          customerEmail: organization.billingEmail,
          customerId: organization.stripeCustomerId,
          organizationId: organization.id,
          organizationSlug: organization.slug,
          priceId: body.priceId,
          purchasedById: user.id,
          seatsUsed: organization._count.memberships,
        });

        return redirect(checkoutSession.url!);
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit(error)) {
      return error;
    }

    throw error;
  }
}
