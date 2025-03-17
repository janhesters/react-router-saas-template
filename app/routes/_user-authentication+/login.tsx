import { useTranslation } from 'react-i18next';
import { useActionData, useNavigation } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { GeneralErrorBoundary } from '~/components/general-error-boundary';
import type { LoginActionData } from '~/features/user-authentication/login/login-action.server';
import { loginAction } from '~/features/user-authentication/login/login-action.server';
import { LoginFormCard } from '~/features/user-authentication/login/login-form-card';
import { LoginVerificationAwaiting } from '~/features/user-authentication/login/login-verification-awaiting';
import { loginIntents } from '~/features/user-authentication/user-authentication-constants';
import { getIsAwaitingEmailConfirmation } from '~/features/user-authentication/user-authentication-helpers';
import { requireUserIsAnonymous } from '~/features/user-authentication/user-authentication-helpers.server';
import { getFormErrors } from '~/utils/get-form-errors';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from './+types/login';

export const handle = { i18n: 'user-authentication' };

export async function loader({ request }: Route.LoaderArgs) {
  const { t } = await promiseHash({
    userIsAnonymous: requireUserIsAnonymous(request),
    t: i18next.getFixedT(request, ['user-authentication', 'common']),
  });
  return { title: getPageTitle(t, 'login.pageTitle') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data.title }];

export async function action(args: Route.ActionArgs) {
  return loginAction(args);
}

export default function LoginRoute() {
  const { t } = useTranslation('user-authentication');
  const navigation = useNavigation();
  const actionData = useActionData<LoginActionData>();

  const isAwaitingEmailConfirmation =
    getIsAwaitingEmailConfirmation(actionData);
  const errors = getFormErrors(actionData);

  const isLoggingInWithEmail =
    navigation.formData?.get('intent') === loginIntents.loginWithEmail;
  const isLoggingInWithGoogle =
    navigation.formData?.get('intent') === loginIntents.loginWithGoogle;
  const isSubmitting = isLoggingInWithEmail || isLoggingInWithGoogle;

  return (
    <>
      <h1 className="sr-only">{t('login.pageTitle')}</h1>

      <div className="flex flex-col gap-6">
        {isAwaitingEmailConfirmation ? (
          <LoginVerificationAwaiting
            email={actionData?.email}
            isResending={isLoggingInWithEmail}
            isSubmitting={isSubmitting}
          />
        ) : (
          <LoginFormCard
            errors={errors}
            isLoggingInWithEmail={isLoggingInWithEmail}
            isLoggingInWithGoogle={isLoggingInWithGoogle}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
