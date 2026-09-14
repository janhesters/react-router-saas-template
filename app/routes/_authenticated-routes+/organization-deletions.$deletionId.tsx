import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Form, href, Link, useNavigation, useRevalidator } from "react-router";

import type { Route } from "./+types/organization-deletions.$deletionId";
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
  getOrganizationDeletionForUser,
  processOrganizationDeletion,
} from "~/features/organizations/deletion/organization-deletion.server";
import { requireAuthenticatedUserExists } from "~/features/user-accounts/user-accounts-helpers.server";
import { getPageTitle } from "~/utils/get-page-title.server";
import { methodNotAllowed, notFound } from "~/utils/http-responses.server";

async function requireDeletion({ context, request, params }: Route.LoaderArgs) {
  const { user } = await requireAuthenticatedUserExists({ context, request });
  const deletion = await getOrganizationDeletionForUser({
    deletionId: params.deletionId,
    userId: user.id,
  });
  if (!deletion) {
    throw notFound();
  }
  return deletion;
}

export async function loader(args: Route.LoaderArgs) {
  const deletion = await requireDeletion(args);
  const i18n = getInstance(args.context);
  return {
    organizationName: deletion.organizationName,
    pageTitle: getPageTitle(
      i18n.t.bind(i18n),
      "organizations:deletion.pageTitle",
    ),
    status: deletion.completedAt
      ? ("completed" as const)
      : deletion.lastError
        ? ("retrying" as const)
        : ("pending" as const),
  };
}

export async function action(args: Route.ActionArgs) {
  if (args.request.method !== "POST") {
    return methodNotAllowed({}, { headers: { Allow: "POST" } });
  }
  const deletion = await requireDeletion(args);
  await processOrganizationDeletion(deletion.id);
  return { result: undefined };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.pageTitle },
];

export default function OrganizationDeletionRoute({
  loaderData,
}: Route.ComponentProps) {
  const { t } = useTranslation("organizations", { keyPrefix: "deletion" });
  const { organizationName, status } = loaderData;
  const navigation = useNavigation();
  const { revalidate, state: revalidationState } = useRevalidator();
  const isSubmitting = navigation.state !== "idle";

  useEffect(() => {
    if (status === "completed" || revalidationState !== "idle") {
      return;
    }
    const timer = window.setTimeout(() => void revalidate(), 3000);
    return () => window.clearTimeout(timer);
  }, [status, revalidate, revalidationState]);

  return (
    <main className="mx-auto max-w-xl p-4 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>{t(`${status}.title`)}</h1>
          </CardTitle>
          <CardDescription>{organizationName}</CardDescription>
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
          <Link className={buttonVariants()} to={href("/organizations")}>
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
