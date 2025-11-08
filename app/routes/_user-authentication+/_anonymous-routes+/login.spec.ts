import { describe, expect, onTestFinished, test } from "vitest";

import { action } from "./login";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import {
  deleteUserAccountFromDatabaseById,
  saveUserAccountToDatabase,
} from "~/features/user-accounts/user-accounts-model.server";
import { loginIntents } from "~/features/user-authentication/user-authentication-constants";
import { anonymousMiddleware } from "~/features/user-authentication/user-authentication-middleware.server";
import {
  createRateLimitedEmail,
  supabaseHandlers,
} from "~/test/mocks/handlers/supabase";
import { setupMockServerLifecycle } from "~/test/msw-test-utils";
import {
  createAuthenticatedRequest,
  createTestContextProvider,
} from "~/test/test-utils";
import { toFormData } from "~/utils/to-form-data";

const createUrl = () => `http://localhost:3000/login`;

const pattern = "/login";

async function sendRequest({ formData }: { formData: FormData }) {
  const request = new Request(createUrl(), {
    body: formData,
    method: "POST",
  });
  const params = {};

  return await action({
    context: await createTestContextProvider({
      middlewares: [anonymousMiddleware],
      params,
      pattern,
      request,
    }),
    params,
    request,
    unstable_pattern: pattern,
  });
}

setupMockServerLifecycle(...supabaseHandlers);

describe("/login route action", () => {
  test("given: an authenticated request, should: throw a redirect to the organizations page", async () => {
    expect.assertions(2);

    const userAccount = createPopulatedUserAccount();
    await saveUserAccountToDatabase(userAccount);
    onTestFinished(async () => {
      await deleteUserAccountFromDatabaseById(userAccount.id);
    });
    const request = await createAuthenticatedRequest({
      formData: toFormData({}),
      method: "POST",
      url: createUrl(),
      user: userAccount,
    });
    const params = {};

    try {
      await action({
        context: await createTestContextProvider({
          middlewares: [anonymousMiddleware],
          params,
          pattern,
          request,
        }),
        params,
        request,
        unstable_pattern: pattern,
      });
    } catch (error) {
      if (error instanceof Response) {
        expect(error.status).toEqual(302);
        expect(error.headers.get("Location")).toEqual("/organizations");
      }
    }
  });

  test("given: an invalid intent, should: return a 400 status code with an error message", async () => {
    const formData = toFormData({ intent: "invalid-intent" });

    const actual = await sendRequest({ formData });

    expect(actual).toMatchObject({
      data: {
        result: {
          error: {
            fieldErrors: {
              intent: expect.arrayContaining(["Invalid input"]),
            },
          },
        },
      },
      init: { status: 400 },
    });
  });

  test("given: no intent, should: return a 400 status code with an error message", async () => {
    const formData = toFormData({});

    const actual = await sendRequest({ formData });

    expect(actual).toMatchObject({
      data: {
        result: {
          error: {
            fieldErrors: {
              intent: expect.arrayContaining(["Invalid input"]),
            },
          },
        },
      },
      init: { status: 400 },
    });
  });

  describe(`${loginIntents.loginWithEmail} intent`, () => {
    const intent = loginIntents.loginWithEmail;

    test("given: a valid email for an existing user, should: return the user's email with no session or user", async () => {
      const userAccount = createPopulatedUserAccount();
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });
      const formData = toFormData({ email: userAccount.email, intent });

      const actual = await sendRequest({ formData });
      const expected = { email: userAccount.email, session: null, user: null };

      expect(actual).toEqual(expected);
    });

    test.each([
      {
        body: { intent },
        given: "no email",
      },
      {
        body: { email: "invalid-email", intent },
        given: "an invalid email",
      },
    ])(
      "given: $given, should: return a 400 status code with an error message",
      async ({ body }) => {
        const formData = toFormData(body);

        const actual = await sendRequest({ formData });
        expect(actual).toMatchObject({
          data: {
            result: {
              error: {
                fieldErrors: {
                  email: expect.arrayContaining([
                    "userAuthentication:login.errors.invalidEmail",
                  ]),
                },
              },
            },
          },
          init: { status: 400 },
        });
      },
    );

    test("given: a valid email for a non-existent user, should: return a 400 status code with an error message", async () => {
      const formData = toFormData({ email: "test@example.com", intent });

      const actual = await sendRequest({ formData });

      expect(actual).toMatchObject({
        data: {
          result: {
            error: {
              fieldErrors: {
                email: expect.arrayContaining([
                  "userAuthentication:login.form.userDoesntExist",
                ]),
              },
            },
          },
        },
        init: { status: 400 },
      });
    });

    test("given: too many requests in a short time, should: return a 400 status code with an error message", async () => {
      const email = createRateLimitedEmail();
      const userAccount = createPopulatedUserAccount({ email });
      await saveUserAccountToDatabase(userAccount);
      onTestFinished(async () => {
        await deleteUserAccountFromDatabaseById(userAccount.id);
      });
      const formData = toFormData({ email, intent });

      const actual = await sendRequest({ formData });

      expect(actual).toMatchObject({
        data: {
          result: {
            error: {
              fieldErrors: {
                email: expect.arrayContaining([
                  "userAuthentication:login.form.loginFailed",
                ]),
              },
            },
          },
        },
        init: { status: 400 },
      });
    });
  });

  describe(`${loginIntents.loginWithGoogle} intent`, () => {
    const intent = loginIntents.loginWithGoogle;

    test("given: a login request with Google, should: return a redirect response to Supabase OAuth URL with code_verifier cookie", async () => {
      const formData = toFormData({ intent });

      const response = (await sendRequest({ formData })) as Response;

      expect(response.status).toEqual(302);
      expect(response.headers.get("Location")).toMatch(
        /^https:\/\/.*\.supabase\.co\/auth\/v1\/authorize\?provider=google/,
      );
      expect(response.headers.get("Set-Cookie")).toMatch(
        /sb-.*-auth-token-code-verifier=/,
      );
    });
  });
});
