import { data, useNavigation } from "react-router";

import type { Route } from "./+types/account";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Separator } from "~/components/ui/separator";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { AccountSettings } from "~/features/user-accounts/settings/account/account-settings";
import { accountSettingsAction } from "~/features/user-accounts/settings/account/account-settings-action.server";
import { DELETE_USER_ACCOUNT_INTENT } from "~/features/user-accounts/settings/account/account-settings-constants";
import { mapUserAccountWithMembershipsToDangerZoneProps } from "~/features/user-accounts/settings/account/account-settings-helpers.server";
import { DangerZone } from "~/features/user-accounts/settings/account/danger-zone";
import { requireAuthenticatedUserWithMembershipsExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = await requireAuthenticatedUserWithMembershipsExists({
    context,
    request,
  });
  const i18n = getInstance(context);

  return data(
    {
      dangerZone: mapUserAccountWithMembershipsToDangerZoneProps(auth.user),
      pageTitle: getPageTitle(
        i18n.t.bind(i18n),
        "settings:userAccount.pageTitle",
      ),
      user: auth.user,
    },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export async function action(args: Route.ActionArgs) {
  return await accountSettingsAction(args);
}

export default function SettingsAccountRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const navigation = useNavigation();
  const isDeletingAccount =
    navigation.formData?.get("intent") === DELETE_USER_ACCOUNT_INTENT;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="space-y-6 px-4 py-4 md:py-6">
        <AccountSettings
          lastResult={actionData?.result}
          user={loaderData.user}
        />

        <Separator />

        <DangerZone
          {...loaderData.dangerZone}
          isDeletingAccount={isDeletingAccount}
        />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
