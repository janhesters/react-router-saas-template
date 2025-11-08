import copyToClipboard from "copy-to-clipboard";
import { AlertTriangleIcon, ClipboardCheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import {
  CREATE_NEW_INVITE_LINK_INTENT,
  DEACTIVATE_INVITE_LINK_INTENT,
} from "./team-members-constants";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { inputClassName } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

export type InviteLinkCardProps = {
  inviteLink?: { href: string; expiryDate: string };
  organizationIsFull?: boolean;
};

export function InviteLinkCard({
  inviteLink,
  organizationIsFull = false,
}: InviteLinkCardProps) {
  const { t, i18n } = useTranslation("organizations", {
    keyPrefix: "settings.teamMembers.inviteLink",
  });

  const [linkCopied, setLinkCopied] = useState(false);

  // Focus management, so that the input's auto focus the link if it changes.
  const mounted = useRef<boolean | null>(null);
  const inviteLinkReference = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (mounted.current && inviteLink?.href) {
      setLinkCopied(false);
      inviteLinkReference.current?.focus();
    }

    // Guard against React 18's ghost remount.
    mounted.current = mounted.current !== null;
  }, [inviteLink?.href]);

  const navigation = useNavigation();
  const isCreatingNewLink =
    navigation.formData?.get("intent") === CREATE_NEW_INVITE_LINK_INTENT;
  const isDeactivatingLink =
    navigation.formData?.get("intent") === DEACTIVATE_INVITE_LINK_INTENT;
  const isSubmitting = isCreatingNewLink || isDeactivatingLink;

  const formatDate = useCallback(
    (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "full", // e.g., "Wednesday, March 26, 2025"
        timeStyle: "short", // e.g., "2:30 PM"
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Browser's timezone
      }).format(date);
    },
    [i18n.language],
  );

  const disabled = isSubmitting || organizationIsFull;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cardTitle")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>

      {inviteLink ? (
        <>
          <CardContent>
            <div className="relative">
              {/** biome-ignore lint/a11y/useAnchorContent: the a tag has an aria-label */}
              <a
                aria-describedby="link-expiration-warning"
                aria-label={t("goToLink")}
                className={cn(
                  inputClassName,
                  "items-center pr-12 read-only:cursor-pointer read-only:opacity-100",
                )}
                href={inviteLink.href}
                ref={inviteLinkReference}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span aria-hidden="true" className="w-full truncate">
                  {inviteLink.href}
                </span>
              </a>

              <Button
                className={cn(
                  "hover:border-input absolute top-0 right-0 rounded-l-none border border-l border-transparent",
                  "border-l-input dark:hover:border-transparent",
                  "dark:hover:border-l-input",
                )}
                onClick={() => {
                  copyToClipboard(inviteLink.href);
                  setLinkCopied(true);
                }}
                size="icon"
                variant="ghost"
              >
                {linkCopied ? (
                  <>
                    <ClipboardCheckIcon />

                    <span className="sr-only">{t("inviteLinkCopied")}</span>
                  </>
                ) : (
                  <>
                    <CopyIcon />

                    <span className="sr-only">{t("copyInviteLink")}</span>
                  </>
                )}
              </Button>

              <p
                className="text-muted-foreground mt-1 flex text-xs"
                id="link-expiration-warning"
              >
                <span className="grow">
                  {t("linkValidUntil", {
                    date: formatDate(inviteLink.expiryDate),
                  })}
                </span>

                <span
                  aria-hidden={linkCopied ? "false" : "true"}
                  aria-live="polite"
                  className={cn(
                    "text-primary transform transition duration-300 ease-in-out",
                    linkCopied
                      ? "translate-x-0 scale-100 opacity-100"
                      : "translate-x-10 scale-75 opacity-0",
                  )}
                >
                  {t("copied")}
                </span>
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex-col items-stretch">
            <div className="flex items-center gap-2">
              <Form className="grow" method="POST" replace>
                <Button
                  aria-describedby="link-regenerate-warning"
                  className="w-full"
                  disabled={disabled}
                  name="intent"
                  type="submit"
                  value="createNewInviteLink"
                >
                  {isCreatingNewLink ? (
                    <>
                      <Spinner />
                      {t("regenerating")}
                    </>
                  ) : (
                    t("regenerateLink")
                  )}
                </Button>
              </Form>

              <Form method="POST" replace>
                <Button
                  disabled={isDeactivatingLink}
                  name="intent"
                  type="submit"
                  value="deactivateInviteLink"
                  variant="outline"
                >
                  {isDeactivatingLink ? (
                    <>
                      <Spinner />
                      {t("deactivating")}
                    </>
                  ) : (
                    t("deactivateLink")
                  )}
                </Button>
              </Form>
            </div>

            <p
              className="text-muted-foreground mt-2 flex items-center text-xs"
              id="link-regenerate-warning"
            >
              <AlertTriangleIcon
                aria-hidden="true"
                className="text-primary mr-1.5 size-4"
              />

              <span>{t("newLinkDeactivatesOld")}</span>
            </p>
          </CardFooter>
        </>
      ) : (
        <CardFooter>
          <Form className="w-full" method="POST" replace>
            <Button
              className="w-full"
              disabled={disabled}
              name="intent"
              type="submit"
              value="createNewInviteLink"
            >
              {isCreatingNewLink ? (
                <>
                  <Spinner />
                  {t("creating")}
                </>
              ) : (
                t("createNewInviteLink")
              )}
            </Button>
          </Form>
        </CardFooter>
      )}
    </Card>
  );
}
