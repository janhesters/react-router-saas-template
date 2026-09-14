import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { data, Form, Link, useNavigation, useRevalidator } from "react-router";

import type { Route } from "./+types/account-deletions.$deletionId";
import { GeneralErrorBoundary } from "~/components/general-error-boundary";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import { getInstance } from "~/features/localization/i18next-middleware.server";
import {
  getAccountDeletionForRecovery,
  processAccountDeletion,
} from "~/features/user-accounts/deletion/account-deletion.server";
import { readAccountDeletionRecovery } from "~/features/user-accounts/deletion/account-deletion-recovery.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { methodNotAllowed, notFound } from "~/utils/http-responses.server";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

async function requireDeletion({ request, params }: Route.LoaderArgs) {
  const recoveryToken = await readAccountDeletionRecovery(
    request,
    params.deletionId,
  );
  if (!recoveryToken) throw notFound();
  const deletion = await getAccountDeletionForRecovery({
    deletionId: params.deletionId,
    recoveryToken,
  });
  if (!deletion) throw notFound();
  return deletion;
}

export async function loader(args: Route.LoaderArgs) {
  const deletion = await requireDeletion(args);
  const i18n = getInstance(args.context);
  return data(
    {
      pageTitle: getPageTitle(
        i18n.t.bind(i18n),
        "settings:userAccount.deletionStatus.pageTitle",
      ),
      status: deletion.completedAt
        ? ("completed" as const)
        : deletion.lastError
          ? ("retrying" as const)
          : ("pending" as const),
    },
    { headers: privateHeaders },
  );
}

export async function action(args: Route.ActionArgs) {
  if (args.request.method !== "POST")
    return methodNotAllowed({}, { headers: { Allow: "POST" } });
  const deletion = await requireDeletion(args);
  await processAccountDeletion(deletion.id);
  return data({ result: undefined }, { headers: privateHeaders });
}

export const headers: Route.HeadersFunction = () => privateHeaders;
export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function AccountDeletionRoute({
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("settings", {
    keyPrefix: "userAccount.deletionStatus",
  });
  const { status } = loaderData;
  const navigation = useNavigation();
  const { revalidate, state } = useRevalidator();
  const isSubmitting = navigation.state !== "idle";
  useEffect(() => {
    if (status === "completed" || state !== "idle") return;
    const timer = window.setTimeout(() => void revalidate(), 3000);
    return () => window.clearTimeout(timer);
  }, [status, revalidate, state]);

  return (
    <main className="mx-auto max-w-xl p-4 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{t(`${status}.title`)}</h1>
          </CardTitle>
          <CardDescription>{t("pageTitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p aria-live="polite" role="status">
            {t(`${status}.description`)}
          </p>
          {status !== "completed" && (
            <Form method="POST">
              <Button disabled={isSubmitting} type="submit" variant="outline">
                {isSubmitting && <Spinner />}
                {t(isSubmitting ? "retryingButton" : "retryButton")}
              </Button>
            </Form>
          )}
          <Link className={buttonVariants()} to="/">
            {t("continueButton")}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
