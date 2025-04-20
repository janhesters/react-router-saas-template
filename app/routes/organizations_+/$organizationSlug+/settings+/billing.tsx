import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { billingAction } from '~/features/billing/billing-action.server';
import { BillingPage } from '~/features/billing/billing-page';

import type { Route } from './+types/billing';

export const handle = { i18n: 'billing' };

export async function action(args: Route.ActionArgs) {
  return await billingAction(args);
}

export default function OrganizationBillingSettingsRoute({
  params,
}: Route.ComponentProps) {
  return (
    <BillingPage
      cancelAtPeriodEnd={false}
      currentMonthlyRatePerUser={10}
      currentPeriodEnd={new Date('2025-02-12T00:00:00.000Z')}
      currentSeats={3}
      currentTierName="Pro"
      isEnterprisePlan={false}
      isOnFreeTrial={false}
      maxSeats={5}
      organizationSlug={params.organizationSlug}
      projectedTotal={50}
      subscriptionStatus="active"
    />
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
