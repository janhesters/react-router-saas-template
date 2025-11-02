import type { AuthOtpResponse } from "@supabase/supabase-js";
import { redirect } from "react-router";
import { z } from "zod";

import { anonymousContext } from "../user-authentication-middleware.server";
import type { EmailLoginErrors } from "./login-schemas";
import { loginWithEmailSchema, loginWithGoogleSchema } from "./login-schemas";
import type { Route } from ".react-router/types/app/routes/_user-authentication+/_anonymous-routes+/+types/login";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { retrieveUserAccountFromDatabaseByEmail } from "~/features/user-accounts/user-accounts-model.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { tooManyRequests, unauthorized } from "~/utils/http-responses.server";
import { validateFormData } from "~/utils/validate-form-data.server";

export type LoginActionData =
  | (AuthOtpResponse["data"] & { email: string })
  | Response
  | { errors: EmailLoginErrors };

const loginSchema = z.discriminatedUnion("intent", [
  loginWithEmailSchema,
  loginWithGoogleSchema,
]);

export async function loginAction({
  request,
  context,
}: Route.ActionArgs): Promise<LoginActionData> {
  try {
    const { supabase, headers } = context.get(anonymousContext);
    const i18n = getInstance(context);
    const body = await validateFormData(request, loginSchema);

    switch (body.intent) {
      case "loginWithEmail": {
        const userAccount = await retrieveUserAccountFromDatabaseByEmail(
          body.email,
        );

        if (!userAccount) {
          throw unauthorized({
            errors: {
              email: {
                message: "user-authentication:login.form.user-doesnt-exist",
              },
            },
          });
        }

        const { data, error } = await supabase.auth.signInWithOtp({
          email: body.email,
          options: {
            data: { appName: i18n.t("common:app-name"), intent: body.intent },
            shouldCreateUser: false,
          },
        });

        if (error) {
          const errorMessage = getErrorMessage(error);

          // Error: For security purposes, you can only request this after 10 seconds.
          if (errorMessage.includes("you can only request this after")) {
            throw tooManyRequests({
              errors: {
                email: {
                  message: "user-authentication:login.form.login-failed",
                },
              },
            });
          }

          throw new Error(errorMessage);
        }

        return { ...data, email: body.email };
      }
      case "loginWithGoogle": {
        const { data, error } = await supabase.auth.signInWithOAuth({
          options: {
            redirectTo: `${process.env.APP_URL}/auth/callback`,
          },
          provider: "google",
        });

        if (error) {
          throw error;
        }

        return redirect(data.url, { headers });
      }
    }
  } catch (error) {
    if (getIsDataWithResponseInit<{ errors: EmailLoginErrors }>(error)) {
      // @ts-expect-error - TypeScript doesn't know that React Router will
      // access the properties of the data property of the response.
      return error;
    }

    throw error;
  }
}
