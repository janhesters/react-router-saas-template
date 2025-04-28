import { data } from 'react-router';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { billingAction } from '~/features/billing/billing-action.server';
import { mapStripeSubscriptionDataToBillingPageProps } from '~/features/billing/billing-helpers.server';
import { BillingPage } from '~/features/billing/billing-page';
import { retrieveLatestStripeSubscriptionByOrganizationId } from '~/features/billing/stripe-subscription-model.server';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { throwIfEntityIsMissing } from '~/utils/throw-if-entity-is-missing.server';

import type { Route } from './+types/billing';

export const handle = { i18n: 'billing' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { organization, headers } = await requireUserIsMemberOfOrganization(
    request,
    params.organizationSlug,
  );
  const subscription = await retrieveLatestStripeSubscriptionByOrganizationId(
    organization.id,
  ).then(throwIfEntityIsMissing);
  const billingPageProps = mapStripeSubscriptionDataToBillingPageProps({
    subscription,
    now: new Date(),
  });

  console.log('billingPageProps', billingPageProps);

  return data({ billingPageProps }, { headers });
}

export async function action(args: Route.ActionArgs) {
  return await billingAction(args);
}

export default function OrganizationBillingSettingsRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { billingPageProps } = loaderData;
  return (
    <BillingPage
      organizationSlug={params.organizationSlug}
      {...billingPageProps}
    />
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
