import { OrganizationMembershipRole } from "@prisma/client";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { useTranslation } from "react-i18next";
import { href, Link, redirect } from "react-router";

import type { Route } from "./+types/_index";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ThemeToggle } from "~/features/color-scheme/theme-toggle";
import { getInstance } from "~/features/localization/i18n-middleware.server";
import { requireOnboardedUserAccountExists } from "~/features/onboarding/onboarding-helpers.server";
import { cn } from "~/lib/utils";
import { getPageTitle } from "~/utils/get-page-title.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireOnboardedUserAccountExists({
    context,
    request,
  });
  const i18n = getInstance(context);

  if (user.memberships.length === 1) {
    // biome-ignore lint/style/noNonNullAssertion: The check above ensures that there is a membership
    return redirect(`/organizations/${user.memberships[0]!.organization.slug}`);
  }

  return {
    memberships: user.memberships,
    title: getPageTitle(
      i18n.t.bind(i18n),
      "organizations:organizations-list.title",
    ),
  };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: loaderData?.title },
];

export default function OrganizationsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { memberships } = loaderData;
  const { t } = useTranslation("organizations", {
    keyPrefix: "organizations-list",
  });

  return (
    <>
      <header className="flex h-(--header-height) items-center border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-2">
          <h1 className="text-base font-medium">{t("page-title")}</h1>

          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl p-4 md:px-0 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t("card-title")}</CardTitle>

            <CardDescription>{t("card-description")}</CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="grid gap-4">
              {memberships.map((membership) => (
                <li key={membership.organization.id}>
                  <Link
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "flex h-auto w-full items-center gap-2 px-4 py-2 text-left",
                    )}
                    to={href("/organizations/:organizationSlug", {
                      organizationSlug: membership.organization.slug,
                    })}
                  >
                    <Avatar className="size-10 shrink-0 items-center justify-center rounded-md border">
                      <AvatarImage
                        alt={membership.organization.name}
                        src={membership.organization.imageUrl}
                      />
                      <AvatarFallback>
                        {membership.organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <span className="block whitespace-normal">
                        {membership.organization.name}
                      </span>
                    </div>

                    <Badge
                      className="shrink-0"
                      variant={
                        membership.role === OrganizationMembershipRole.owner
                          ? "default"
                          : membership.role === OrganizationMembershipRole.admin
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {membership.role === OrganizationMembershipRole.owner
                        ? t("roles.owner")
                        : membership.role === OrganizationMembershipRole.admin
                          ? t("roles.admin")
                          : t("roles.member")}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
