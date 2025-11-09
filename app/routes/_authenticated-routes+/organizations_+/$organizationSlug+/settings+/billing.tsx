import { OrganizationMembershipRole } from "@prisma/client";
import { data, href, useNavigation } from "react-router";

import type { Route } from "./+types/billing";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { billingAction } from "~/features/billing/billing-action.server";
import {
  allLookupKeys,
  CANCEL_SUBSCRIPTION_INTENT,
  KEEP_CURRENT_SUBSCRIPTION_INTENT,
  RESUME_SUBSCRIPTION_INTENT,
  VIEW_INVOICES_INTENT,
} from "~/features/billing/billing-constants";
import {
  getCreateSubscriptionModalProps,
  mapStripeSubscriptionDataToBillingPageProps,
} from "~/features/billing/billing-helpers.server";
import { BillingPage } from "~/features/billing/billing-page";
import { retrieveProductsFromDatabaseByPriceLookupKeys } from "~/features/billing/stripe-product-model.server";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { organizationMembershipContext } from "~/features/organizations/organizations-middleware.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { notFound } from "~/utils/http-responses.server";

export async function loader({ context, params }: Route.LoaderArgs) {
  const { organization, headers, role } = context.get(
    organizationMembershipContext,
  );
  const products = await retrieveProductsFromDatabaseByPriceLookupKeys(
    allLookupKeys as unknown as string[],
  );
  const i18n = getInstance(context);
  const t = i18n.t.bind(i18n);

  if (role === OrganizationMembershipRole.member) {
    throw notFound();
  }

  return data(
    {
      billingPageProps: {
        ...mapStripeSubscriptionDataToBillingPageProps({
          now: new Date(),
          organization,
        }),
        ...getCreateSubscriptionModalProps(organization, products),
      },
      breadcrump: {
        title: t("billing:billingPage.breadcrumb"),
        to: href("/organizations/:organizationSlug/settings/billing", {
          organizationSlug: params.organizationSlug,
        }),
      },
      pageTitle: getPageTitle(t, "billing:billingPage.pageTitle"),
    },
    { headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await billingAction(args);
}

export default function OrganizationBillingSettingsRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { billingPageProps } = loaderData;

  const navigation = useNavigation();
  const isCancellingSubscription =
    navigation.formData?.get("intent") === CANCEL_SUBSCRIPTION_INTENT;
  const isKeepingCurrentSubscription =
    navigation.formData?.get("intent") === KEEP_CURRENT_SUBSCRIPTION_INTENT;
  const isResumingSubscription =
    navigation.formData?.get("intent") === RESUME_SUBSCRIPTION_INTENT;
  const isViewingInvoices =
    navigation.formData?.get("intent") === VIEW_INVOICES_INTENT;

  return (
    <BillingPage
      {...billingPageProps}
      isCancellingSubscription={isCancellingSubscription}
      isKeepingCurrentSubscription={isKeepingCurrentSubscription}
      isResumingSubscription={isResumingSubscription}
      isViewingInvoices={isViewingInvoices}
      // @ts-expect-error - actionData is typed as never for some reason
      lastResult={actionData?.result}
    />
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
