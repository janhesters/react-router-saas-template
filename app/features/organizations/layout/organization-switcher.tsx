import type { Organization } from "@prisma/client";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Form, Link, useLocation } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import { SWITCH_ORGANIZATION_INTENT } from "./sidebar-layout-constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
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

type OrganizationSwitcherOrganization = {
  id: Organization["id"];
  name: Organization["name"];
  logo: Organization["imageUrl"];
  slug: Organization["slug"];
  tier: Tier;
};

export type OrganizationSwitcherProps = {
  organizations: OrganizationSwitcherOrganization[];
  currentOrganization?: OrganizationSwitcherOrganization;
};

export function OrganizationSwitcher({
  organizations,
  currentOrganization,
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
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              // Playwright shouldn't try to click the button before it's hydrated
              disabled={!hydrated}
              size="lg"
            >
              <Avatar className="aspect-square size-8 rounded-lg">
                <AvatarImage
                  alt={currentOrganization.name}
                  className="object-cover"
                  src={currentOrganization.logo}
                />

                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg">
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

              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="max-w-(--radix-dropdown-menu-trigger-width) min-w-(--radix-dropdown-menu-trigger-width) rounded-lg md:max-w-80 md:min-w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t("organizations")}
            </DropdownMenuLabel>

            {organizations.map((organization) => (
              <Form key={organization.id} method="POST" replace>
                <DropdownMenuItem asChild className="w-full gap-2 p-2">
                  <button
                    name="intent"
                    type="submit"
                    value={SWITCH_ORGANIZATION_INTENT}
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

                    <Avatar className="aspect-square size-6 rounded-sm border">
                      <AvatarImage
                        alt={organization.name}
                        className="object-cover"
                        src={organization.logo}
                      />

                      <AvatarFallback className="rounded-sm">
                        {organization.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {organization.name}
                  </button>
                </DropdownMenuItem>
              </Form>
            ))}
            <DropdownMenuSeparator />

            <Link to="/organizations/new">
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <PlusIcon className="size-4" />
                </div>

                <div className="text-muted-foreground font-medium">
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
