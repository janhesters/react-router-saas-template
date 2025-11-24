import { Building2Icon, CreditCardIcon, UsersIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { href, useMatch } from "react-router";

import { NavGroup } from "../layout/nav-group";
import type { OrganizationMembershipRole } from "~/generated/browser";
import { cn } from "~/lib/utils";

type SettingsSidebarProps = {
  organizationSlug: string;
  role: OrganizationMembershipRole;
};

export function SettingsSidebar({
  organizationSlug,
  role,
}: SettingsSidebarProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.layout",
  });

  // Check if we're exactly on the settings index route
  const isOnSettingsIndex = useMatch(
    href("/organizations/:organizationSlug/settings", {
      organizationSlug,
    }),
  );

  return (
    <aside
      className={cn(
        "bg-background text-sidebar-foreground flex flex-col border-r md:peer-data-[variant=inset]:rounded-bl-xl",
        // Full width on mobile when on settings index, normal sidebar width
        // on desktop
        isOnSettingsIndex
          ? "w-full"
          : "hidden md:flex md:w-64 md:shrink-0 md:overflow-y-auto",
      )}
    >
      <nav
        aria-label={t("settingsNav")}
        className="flex min-h-0 flex-1 flex-col gap-2 p-2"
      >
        <NavGroup
          items={[
            {
              icon: Building2Icon,
              title: t("general"),
              url: href("/organizations/:organizationSlug/settings/general", {
                organizationSlug,
              }),
            },
            {
              icon: UsersIcon,
              title: t("teamMembers"),
              url: href("/organizations/:organizationSlug/settings/members", {
                organizationSlug,
              }),
            },
            ...(role !== "member"
              ? [
                  {
                    icon: CreditCardIcon,
                    title: t("billing"),
                    url: href(
                      "/organizations/:organizationSlug/settings/billing",
                      {
                        organizationSlug,
                      },
                    ),
                  },
                ]
              : []),
          ]}
        />
      </nav>
    </aside>
  );
}
