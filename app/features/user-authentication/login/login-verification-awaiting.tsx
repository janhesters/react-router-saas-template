import { TriangleAlertIcon } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Form } from "react-router";

import { useCountdown } from "../use-countdown";
import { loginIntents } from "../user-authentication-constants";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";

export type LoginVerificationAwaitingProps = {
  email: string;
  isResending?: boolean;
  isSubmitting?: boolean;
};

export function LoginVerificationAwaiting({
  email,
  isResending = false,
  isSubmitting = false,
}: LoginVerificationAwaitingProps) {
  const { t } = useTranslation("userAuthentication", {
    keyPrefix: "login.magicLink",
  });

  const { secondsLeft, reset } = useCountdown(60);

  const waitingToResend = secondsLeft !== 0;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("cardTitle")}</CardTitle>

        <CardDescription className="text-center">
          {t("cardDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          <p className="text-muted-foreground text-xs">
            <Trans
              components={{ 1: <b /> }}
              count={secondsLeft}
              i18nKey="login.magicLink.countdownMessage"
              ns="userAuthentication"
            />
          </p>

          <Form method="post" onSubmit={() => reset()}>
            <fieldset disabled={waitingToResend || isSubmitting || isResending}>
              <input name="email" type="hidden" value={email} />

              <Button
                className="w-full"
                name="intent"
                type="submit"
                value={loginIntents.loginWithEmail}
              >
                {isResending ? (
                  <>
                    <Spinner />
                    {t("resendButtonLoading")}
                  </>
                ) : (
                  t("resendButton")
                )}
              </Button>
            </fieldset>
          </Form>

          <Alert>
            <TriangleAlertIcon />

            <AlertDescription>{t("alertDescription")}</AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
