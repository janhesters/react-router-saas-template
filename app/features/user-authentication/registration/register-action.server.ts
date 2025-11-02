import type { AuthOtpResponse } from "@supabase/supabase-js";
import { redirect } from "react-router";
import { z } from "zod";

import { anonymousContext } from "../user-authentication-middleware.server";
import type { EmailRegistrationErrors } from "./registration-schemas";
import {
  registerWithEmailSchema,
  registerWithGoogleSchema,
} from "./registration-schemas";
import type { Route } from ".react-router/types/app/routes/_user-authentication+/_anonymous-routes+/+types/login";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { retrieveUserAccountFromDatabaseByEmail } from "~/features/user-accounts/user-accounts-model.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { getIsDataWithResponseInit } from "~/utils/get-is-data-with-response-init.server";
import { conflict, tooManyRequests } from "~/utils/http-responses.server";
import { validateFormData } from "~/utils/validate-form-data.server";

export type RegisterActionData =
  | (AuthOtpResponse["data"] & { email: string })
  | Response
  | { errors: EmailRegistrationErrors };

const registerSchema = z.discriminatedUnion("intent", [
  registerWithEmailSchema,
  registerWithGoogleSchema,
]);

export async function registerAction({
  request,
  context,
}: Route.ActionArgs): Promise<RegisterActionData> {
  try {
    const { supabase, headers } = context.get(anonymousContext);
    const i18n = getInstance(context);
    const body = await validateFormData(request, registerSchema);

    switch (body.intent) {
      case "registerWithEmail": {
        const userAccount = await retrieveUserAccountFromDatabaseByEmail(
          body.email,
        );

        if (userAccount) {
          throw conflict({
            errors: {
              email: {
                message:
                  "user-authentication:register.form.user-already-exists",
              },
            },
          });
        }

        const { data, error } = await supabase.auth.signInWithOtp({
          email: body.email,
          options: {
            data: { appName: i18n.t("common:app-name"), intent: body.intent },
            shouldCreateUser: true,
          },
        });

        if (error) {
          const errorMessage = getErrorMessage(error);

          if (errorMessage.includes("you can only request this after")) {
            throw tooManyRequests({
              errors: {
                email: {
                  message: "user-authentication:register.registration-failed",
                },
              },
            });
          }

          throw error;
        }

        return { ...data, email: body.email };
      }
      case "registerWithGoogle": {
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
    if (getIsDataWithResponseInit<{ errors: EmailRegistrationErrors }>(error)) {
      // @ts-expect-error - TypeScript doesn't know that React Router will
      // access the properties of the data property of the response.
      return error;
    }

    throw error;
  }
}
