import { data } from 'react-router';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { billingAction } from '~/features/billing/billing-action.server';
import { mapStripeSubscriptionDataToBillingPageProps } from '~/features/billing/billing-helpers.server';
import { BillingPage } from '~/features/billing/billing-page';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';

import type { Route } from './+types/billing';

export const handle = { i18n: 'billing' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { organization, headers } = await requireUserIsMemberOfOrganization(
    request,
    params.organizationSlug,
  );
  const billingPageProps = mapStripeSubscriptionDataToBillingPageProps({
    organization,
    now: new Date(),
  });

  return data({ billingPageProps }, { headers });
}

export async function action(args: Route.ActionArgs) {
  return await billingAction(args);
}

export default function OrganizationBillingSettingsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { billingPageProps } = loaderData;
  return <BillingPage {...billingPageProps} />;
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
