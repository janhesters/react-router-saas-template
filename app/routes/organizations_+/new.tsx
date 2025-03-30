import { useTranslation } from 'react-i18next';
import { useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { CREATE_ORGANIZATION_INTENT } from '~/features/organizations/create-organization/create-organization-constants';
import { CreateOrganizationFormCard } from '~/features/organizations/create-organization/create-organization-form-card';
import { createOrganizationAction } from '~/features/organizations/create-organization/creatie-organization-action.server';
import { requireAuthenticatedUserExists } from '~/features/user-accounts/user-accounts-helpers.server';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/new';

export const handle = { i18n: ['organizations', 'drag-and-drop'] };

export async function loader(args: Route.LoaderArgs) {
  const { t } = await promiseHash({
    userIsAnonymous: requireAuthenticatedUserExists(args.request),
    t: i18next.getFixedT(args.request, ['organizations', 'common']),
  });
  return { title: getPageTitle(t, 'new.page-title') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data?.title }];

export async function action(args: Route.ActionArgs) {
  return await createOrganizationAction(args);
}

export default function NewOrganizationRoute({
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation('organizations', { keyPrefix: 'new' });

  const errors = getFormErrors(actionData);

  const navigation = useNavigation();
  const isCreatingOrganization =
    navigation.formData?.get('intent') === CREATE_ORGANIZATION_INTENT;

  return (
    <>
      <header className="sr-only">
        <h1>{t('page-title')}</h1>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 md:py-6 lg:px-6">
        <CreateOrganizationFormCard
          errors={errors}
          isCreatingOrganization={isCreatingOrganization}
        />
      </main>
    </>
  );
}
