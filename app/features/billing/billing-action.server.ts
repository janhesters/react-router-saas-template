import { redirect } from 'react-router';
import { z } from 'zod';

import { validateFormData } from '~/utils/validate-form-data.server';

import type { Route } from '../../routes/organizations_+/$organizationSlug+/settings+/+types/billing';
import { OPEN_CUSTOMER_PORTAL_INTENT } from './billing-constanst';
import { openCustomerPortalSchema } from './billing-schemas';
import { createStripeCustomerPortalSession } from './stripe-helpers.server';

const schema = z.discriminatedUnion('intent', [openCustomerPortalSchema]);

export async function billingAction({ request, params }: Route.ActionArgs) {
  const body = await validateFormData(request, schema);

  switch (body.intent) {
    case OPEN_CUSTOMER_PORTAL_INTENT: {
      const url = await createStripeCustomerPortalSession({
        baseUrl: request.url,
        customerId: '', // USER_ID
        organizationSlug: params.organizationSlug,
      });

      return redirect(url);
    }
  }
}
