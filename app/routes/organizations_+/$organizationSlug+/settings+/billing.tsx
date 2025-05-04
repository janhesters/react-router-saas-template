import { OrganizationMembershipRole } from '@prisma/client';
import { data } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { billingAction } from '~/features/billing/billing-action.server';
import { mapStripeSubscriptionDataToBillingPageProps } from '~/features/billing/billing-helpers.server';
import { BillingPage } from '~/features/billing/billing-page';
import { requireUserIsMemberOfOrganization } from '~/features/organizations/organizations-helpers.server';
import { getPageTitle } from '~/utils/get-page-title.server';
import { notFound } from '~/utils/http-responses.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/billing';

export const handle = { i18n: 'billing' };

export async function loader({ request, params }: Route.LoaderArgs) {
  const {
    auth: { organization, headers, role },
    t,
  } = await promiseHash({
    auth: requireUserIsMemberOfOrganization(request, params.organizationSlug),
    t: i18next.getFixedT(request, ['billing', 'common']),
  });

  if (role === OrganizationMembershipRole.member) {
    // TODO: write E2E tests for this
    throw notFound();
  }

  const billingPageProps = mapStripeSubscriptionDataToBillingPageProps({
    organization,
    now: new Date(),
  });

  return data(
    { billingPageProps, title: getPageTitle(t, 'billing-page.page-title') },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

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
