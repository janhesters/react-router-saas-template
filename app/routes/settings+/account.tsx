import { useTranslation } from 'react-i18next';
import { data, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import { Separator } from '~/components/ui/separator';
import { AccountSettings } from '~/features/user-accounts/settings/account/account-settings';
import { accountSettingsAction } from '~/features/user-accounts/settings/account/account-settings-action.server';
import { UPDATE_USER_ACCOUNT_INTENT } from '~/features/user-accounts/settings/account/account-settings-constants';
import { mapUserAccountWithMembershipsToDangerZoneProps } from '~/features/user-accounts/settings/account/account-settings-helpers.server';
import { DangerZone } from '~/features/user-accounts/settings/account/danger-zone';
import { requireAuthenticatedUserWithMembershipsExists } from '~/features/user-accounts/user-accounts-helpers.server';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/account';

export const handle = { i18n: 'user-accounts' };

export async function loader({ request }: Route.LoaderArgs) {
  const { auth, t } = await promiseHash({
    auth: requireAuthenticatedUserWithMembershipsExists(request),
    t: i18next.getFixedT(request, ['user-accounts', 'common']),
  });

  return data(
    {
      title: getPageTitle(t, 'settings.account.page-title'),
      user: auth.user,
      dangerZone: mapUserAccountWithMembershipsToDangerZoneProps(auth.user),
    },
    { headers: auth.headers },
  );
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await accountSettingsAction(args);
}

export default function SettingsAccountRoute({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation('user-accounts', {
    keyPrefix: 'settings.account',
  });
  const navigation = useNavigation();
  const isUpdatingUserAccount =
    navigation.formData?.get('intent') === UPDATE_USER_ACCOUNT_INTENT;
  const errors = getFormErrors(
    actionData as Awaited<ReturnType<typeof action>>,
  );

  return (
    <div className="px-4 py-4 md:py-6 lg:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="leading-none font-semibold">{t('page-title')}</h2>

          <p className="text-muted-foreground text-sm">{t('description')}</p>
        </div>

        <Separator />

        <AccountSettings
          errors={errors}
          isUpdatingUserAccount={isUpdatingUserAccount}
          user={loaderData.user}
        />

        <Separator />

        <DangerZone {...loaderData.dangerZone} />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
