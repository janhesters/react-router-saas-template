import { IconPlus, IconSelector } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Form, Link, useLocation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import { SWITCH_ORGANIZATION_INTENT } from "./sidebar-layout-constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import type { Tier } from "~/features/billing/billing-constants";
import type { Organization } from "~/generated/browser";

type OrganizationSwitcherOrganization = {
  id: Organization["id"];
  logo: Organization["imageUrl"];
  name: Organization["name"];
  slug: Organization["slug"];
  tier: Tier;
};

export type OrganizationSwitcherProps = {
  currentOrganization?: OrganizationSwitcherOrganization;
  organizations: OrganizationSwitcherOrganization[];
};

export function OrganizationSwitcher({
  currentOrganization,
  organizations,
}: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation("organizations", {
    keyPrefix: "layout.organizationSwitcher",
  });
  const { t: tTier } = useTranslation("billing", {
    keyPrefix: "pricing.plans",
  });
  const location = useLocation();
  const currentPath = location.pathname;
  const hydrated = useHydrated();

  if (!currentOrganization) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                // Playwright shouldn't try to click the button before it's hydrated
                disabled={!hydrated}
                size="lg"
              />
            }
          >
            <Avatar className="aspect-square size-8 rounded-lg after:rounded-lg">
              <AvatarImage
                alt={currentOrganization.name}
                className="rounded-lg object-cover"
                src={currentOrganization.logo}
              />

              <AvatarFallback className="rounded-lg" variant="sidebar">
                {currentOrganization.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {currentOrganization.name}
              </span>

              <span className="truncate text-xs">
                {tTier(`${currentOrganization.tier}.title`, {
                  defaultValue: "Enterprise",
                })}
              </span>
            </div>

            <IconSelector className="ml-auto" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="max-w-(--radix-dropdown-menu-trigger-width) min-w-(--radix-dropdown-menu-trigger-width) rounded-lg md:max-w-80 md:min-w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>

              {organizations.map((organization) => (
                <Form key={organization.id} method="POST" replace>
                  <DropdownMenuItem
                    className="w-full gap-2 p-2"
                    nativeButton
                    render={
                      // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- DropdownMenuItem supplies the organization name as button content.
                      <button
                        name="intent"
                        type="submit"
                        value={SWITCH_ORGANIZATION_INTENT}
                      />
                    }
                  >
                    <input
                      name="organizationId"
                      type="hidden"
                      value={organization.id}
                    />
                    <input
                      name="currentPath"
                      type="hidden"
                      value={currentPath}
                    />

                    <Avatar className="aspect-square size-6 shrink-0 rounded-sm border after:rounded-sm">
                      <AvatarImage
                        alt={organization.name}
                        className="rounded-sm object-cover"
                        src={organization.logo}
                      />

                      <AvatarFallback className="rounded-sm">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate">
                      {organization.name}
                    </span>
                  </DropdownMenuItem>
                </Form>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <Link to="/organizations/new">
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <IconPlus className="size-4" />
                </div>

                <div className="font-medium text-muted-foreground">
                  {t("newOrganization")}
                </div>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
