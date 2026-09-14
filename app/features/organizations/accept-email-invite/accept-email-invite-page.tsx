import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { ACCEPT_EMAIL_INVITE_INTENT } from "./accept-email-invite-constants";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import type { Organization, UserAccount } from "~/generated/browser";

export type AcceptEmailInvitePageProps = {
  inviterName: UserAccount["name"];
  organizationName: Organization["name"];
};

export function AcceptEmailInvitePage({
  inviterName,
  organizationName,
}: AcceptEmailInvitePageProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "acceptEmailInvite",
  });
  const { t: tCommon } = useTranslation("translation");
  const navigation = useNavigation();
  const isAcceptingInvite =
    navigation.formData?.get("intent") === ACCEPT_EMAIL_INVITE_INTENT;

  return (
    <main className="relative isolate px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-gradient-to-tr from-primary to-secondary opacity-30 clip-ambient-glow sm:left-[calc(50%-30rem)] sm:w-288.75" />
      </div>

      <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
        <div className="mb-8 flex justify-center">
          <Badge variant="secondary-outline">
            {t("welcomeToAppName", { appName: tCommon("appName") })}
          </Badge>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t("inviteYouToJoin", { inviterName, organizationName })}
          </h1>

          <p className="mt-6 text-base leading-6 text-balance text-muted-foreground sm:text-lg sm:leading-8">
            {t("acceptInviteInstructions")}
          </p>

          <Form
            className="mt-10 flex items-center justify-center gap-x-6"
            method="POST"
          >
            <Button
              disabled={isAcceptingInvite}
              name="intent"
              type="submit"
              value={ACCEPT_EMAIL_INVITE_INTENT}
            >
              {isAcceptingInvite ? (
                <>
                  <Spinner />
                  {t("acceptingInvite")}
                </>
              ) : (
                t("acceptInvite")
              )}
            </Button>
          </Form>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-44rem)]"
      >
        <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-gradient-to-tr from-primary to-secondary opacity-30 clip-ambient-glow sm:left-[calc(50%+36rem)] sm:w-288.75" />
      </div>
    </main>
  );
}
