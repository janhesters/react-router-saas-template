import { report } from "@conform-to/react/future";
import { redirect } from "react-router";
import { z } from "zod";

import { anonymousContext } from "../user-authentication-middleware.server";
import {
  registerWithEmailSchema,
  registerWithGoogleSchema,
} from "./registration-schemas";
import type { Route } from ".react-router/types/app/routes/_user-authentication+/_anonymous-routes+/+types/register";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import { retrieveUserAccountFromDatabaseByEmail } from "~/features/user-accounts/user-accounts-model.server";
import { getErrorMessage } from "~/utils/get-error-message";
import { badRequest } from "~/utils/http-responses.server";
import { validateFormData } from "~/utils/validate-form-data.server";

const registerSchema = z.discriminatedUnion("intent", [
  registerWithEmailSchema,
  registerWithGoogleSchema,
]);

export async function registerAction({ request, context }: Route.ActionArgs) {
  const { supabase, headers } = context.get(anonymousContext);
  const i18n = getInstance(context);
  const result = await validateFormData(request, registerSchema);

  if (!result.success) {
    return result.response;
  }

  const body = result.data;

  switch (body.intent) {
    case "registerWithEmail": {
      const userAccount = await retrieveUserAccountFromDatabaseByEmail(
        body.email,
      );

      if (userAccount) {
        return badRequest({
          result: report(result.submission, {
            error: {
              fieldErrors: {
                email: ["userAuthentication:register.form.userAlreadyExists"],
              },
              formErrors: [],
            },
          }),
        });
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: body.email,
        options: {
          data: { appName: i18n.t("translation:appName"), intent: body.intent },
          shouldCreateUser: true,
        },
      });

      if (error) {
        const errorMessage = getErrorMessage(error);

        if (errorMessage.includes("you can only request this after")) {
          return badRequest({
            result: report(result.submission, {
              error: {
                fieldErrors: {
                  email: [
                    "userAuthentication:register.form.registrationFailed",
                  ],
                },
                formErrors: [],
              },
            }),
          });
        }

        throw error;
      }

      return { ...data, email: body.email, result: undefined };
    }
    case "registerWithGoogle": {
      const { data, error } = await supabase.auth.signInWithOAuth({
        options: { redirectTo: `${process.env.APP_URL}/auth/callback` },
        provider: "google",
      });

      if (error) {
        throw error;
      }

      return redirect(data.url, { headers });
    }
  }
}
