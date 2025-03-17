import { OrganizationMembershipRole } from '@prisma/client';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { useTranslation } from 'react-i18next';
import { Link, redirect, useLoaderData } from 'react-router';
import { promiseHash } from 'remix-utils/promise';

import { Avatar, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { requireOnboardedUserAccountExists } from '~/features/onboarding/onboarding-helpers.server';
import { retrieveActiveOrganizationsMembershipsFromDatabaseByUserId } from '~/features/organizations/organizations-model.server';
import { cn } from '~/lib/utils';
import { getPageTitle } from '~/utils/get-page-title.server';
import i18next from '~/utils/i18next.server';

import type { Route } from '../onboarding+/+types/organization';

export const handle = { i18n: 'organizations' };

export async function loader({ request }: Route.LoaderArgs) {
  const {
    user: { user },
    t,
  } = await promiseHash({
    user: requireOnboardedUserAccountExists(request),
    t: i18next.getFixedT(request, ['organizations', 'common']),
  });

  if (user.memberships.length === 1) {
    return redirect(`/organizations/${user.memberships[0].organization.slug}`);
  }

  const memberships =
    await retrieveActiveOrganizationsMembershipsFromDatabaseByUserId(user.id);

  return { memberships, title: getPageTitle(t, 'organizationsList.title') };
}

export const meta: Route.MetaFunction = ({ data }) => [{ title: data.title }];

export default function OrganizationsRoute() {
  const { memberships } = useLoaderData<typeof loader>();
  const { t } = useTranslation('organizations');

  return (
    <>
      <header className="sr-only">
        <h1>{t('organizationsList.pageTitle')}</h1>
      </header>

      <main className="mx-auto max-w-xl p-4 md:px-0 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle>{t('organizationsList.cardTitle')}</CardTitle>
            <CardDescription>
              {t('organizationsList.cardDescription')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ul className="grid gap-4">
              {memberships.map(membership => (
                <li key={membership.organization.id}>
                  <Link
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'flex h-auto w-full items-center gap-2 px-4 py-2 text-left',
                    )}
                    to={`/organizations/${membership.organization.slug}`}
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
                      variant={
                        membership.role === OrganizationMembershipRole.owner
                          ? 'default'
                          : membership.role === OrganizationMembershipRole.admin
                            ? 'secondary'
                            : 'outline'
                      }
                      className="shrink-0"
                    >
                      {membership.role === OrganizationMembershipRole.owner
                        ? t('common.roles.owner')
                        : membership.role === OrganizationMembershipRole.admin
                          ? t('common.roles.admin')
                          : t('common.roles.member')}
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
