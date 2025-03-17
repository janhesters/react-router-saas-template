import { describe, expect, onTestFinished, test } from 'vitest';

import { onboardingIntents } from '~/features/onboarding/onboarding-constants';
import { createPopulatedOrganization } from '~/features/organizations/organizations-factories.server';
import {
  deleteOrganizationFromDatabaseById,
  saveOrganizationWithOwnerToDatabase,
} from '~/features/organizations/organizations-model.server';
import { createPopulatedUserAccount } from '~/features/user-accounts/user-accounts-factories.server';
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from '~/features/user-accounts/user-accounts-model.server';
import { supabaseHandlers } from '~/test/mocks/handlers/supabase';
import { setupMockServerLifecycle } from '~/test/msw-test-utils';
import { createAuthenticatedRequest } from '~/test/test-utils';
import { badRequest } from '~/utils/http-responses.server';
import { toFormData } from '~/utils/to-form-data';

import { action } from './user-account';

const createUrl = () => `http://localhost:3000/onboarding/user-account`;

async function sendAuthenticatedRequest({
  userAccount,
  formData,
}: {
  userAccount: ReturnType<typeof createPopulatedUserAccount>;
  formData: FormData;
}) {
  const request = await createAuthenticatedRequest({
    url: createUrl(),
    user: userAccount,
    method: 'POST',
    formData,
  });

  return await action({ request, context: {}, params: {} });
}

async function setup(userAccount = createPopulatedUserAccount()) {
  await saveUserAccountToDatabase(userAccount);
  onTestFinished(async () => {
    await deleteUserAccountFromDatabaseById(userAccount.id);
  });

  return { userAccount };
}

setupMockServerLifecycle(...supabaseHandlers);

describe('/onboarding/user-account route action', () => {
  test('given: an unauthenticated request, should: throw a redirect to the login page', async () => {
    expect.assertions(2);

    const request = new Request(createUrl(), {
      method: 'POST',
      body: toFormData({}),
    });

    try {
      await action({ request, context: {}, params: {} });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/login?redirectTo=%2Fonboarding%2Fuser-account`,
        );
      }
    }
  });

  test('given: a user who has completed onboarding, should: redirect to organizations page', async () => {
    expect.assertions(2);

    const { userAccount } = await setup();
    const organization = await saveOrganizationWithOwnerToDatabase({
      organization: createPopulatedOrganization(),
      userId: userAccount.id,
    });
    onTestFinished(async () => {
      await deleteOrganizationFromDatabaseById(organization.id);
    });

    try {
      await sendAuthenticatedRequest({ userAccount, formData: toFormData({}) });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get('Location')).toEqual(
          `/organizations/${organization.slug}`,
        );
      }
    }
  });

  describe(`${onboardingIntents.createUserAccount} intent`, () => {
    const intent = onboardingIntents.createUserAccount;

    test('given: a valid name for a user without organizations, should: update name and redirect to organization onboarding', async () => {
      const userAccount = createPopulatedUserAccount({ name: '' });
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });

      const formData = toFormData({ intent, name: 'Test User' });

      const response = (await sendAuthenticatedRequest({
        userAccount,
        formData,
      })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get('Location')).toEqual(
        '/onboarding/organization',
      );
    });

    test.each([
      {
        given: 'no name provided',
        body: { intent },
        expected: badRequest({ errors: { name: { message: 'Required' } } }),
      },
      {
        given: 'a name that is too short (1 character)',
        body: { intent, name: 'a' },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:user-account.name-min-length' },
          },
        }),
      },
      {
        given: 'a name that is too long (129 characters)',
        body: { intent, name: 'a'.repeat(129) },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:user-account.name-max-length' },
          },
        }),
      },
      {
        given: 'a name with only whitespace',
        body: { intent, name: '   ' },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:user-account.name-min-length' },
          },
        }),
      },
      {
        given: 'a too short name with whitespace',
        body: { intent, name: '  a ' },
        expected: badRequest({
          errors: {
            name: { message: 'onboarding:user-account.name-min-length' },
          },
        }),
      },
    ])(
      'given: $given, should: return a 400 status code with an error message',
      async ({ body, expected }) => {
        const userAccount = createPopulatedUserAccount({ name: '' });
        await saveUserAccountToDatabase(userAccount);
        onTestFinished(async () => {
          await deleteUserAccountFromDatabaseById(userAccount.id);
        });

        // @ts-expect-error - Some test cases intentionally omit required fields
        const formData = toFormData(body);

        const actual = await sendAuthenticatedRequest({
          userAccount,
          formData,
        });

        expect(actual).toEqual(expected);
      },
    );
  });
});
