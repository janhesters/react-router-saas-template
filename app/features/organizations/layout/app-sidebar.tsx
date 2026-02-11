import {
  IconBriefcase,
  IconCalendar,
  IconFileText,
  IconHelpCircle,
  IconLayoutDashboard,
  IconListCheck,
  IconMessageCircle,
  IconRobot,
  IconSettings,
  IconUser,
  IconVideo,
  IconWallet,
} from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { href } from "react-router";

import { NavGroup } from "./nav-group";
import type { NavUserProps } from "./nav-user";
import { NavUser } from "./nav-user";
import type { OrganizationSwitcherProps } from "./organization-switcher";
import { OrganizationSwitcher } from "./organization-switcher";
import type { Route } from ".react-router/types/app/routes/_authenticated-routes+/organizations_+/$organizationSlug+/+types/_sidebar-layout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import type { BillingSidebarCardProps } from "~/features/billing/billing-sidebar-card";
import { BillingSidebarCard } from "~/features/billing/billing-sidebar-card";
import { cn } from "~/lib/utils";

type AppSidebarProps = {
  organizationSlug: Route.ComponentProps["params"]["organizationSlug"];
  billingSidebarCardProps?: BillingSidebarCardProps;
  organizationSwitcherProps: OrganizationSwitcherProps;
  navUserProps: NavUserProps;
} & ComponentProps<typeof Sidebar>;

export function AppSidebar({
  billingSidebarCardProps,
  navUserProps,
  organizationSlug,
  organizationSwitcherProps,
  ...props
}: AppSidebarProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "layout.appSidebar.nav",
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher {...organizationSwitcherProps} />
      </SidebarHeader>

      <SidebarContent>
        <NavGroup
          items={[
            {
              icon: IconLayoutDashboard,
              title: t("app.home"),
              url: href("/organizations/:organizationSlug/home", {
                organizationSlug,
              }),
            },
            {
              icon: IconUser,
              title: t("app.myCandidates"),
              url: href("/organizations/:organizationSlug/my-candidates", {
                organizationSlug,
              }),
            },
            {
              icon: IconBriefcase,
              title: t("app.ourCandidates"),
              url: href("/organizations/:organizationSlug/our-candidates", {
                organizationSlug,
              }),
            },
            {
              icon: IconMessageCircle,
              title: t("app.messagingHub"),
              url: href("/organizations/:organizationSlug/messaging-hub", {
                organizationSlug,
              }),
            },
            {
              icon: IconListCheck,
              title: t("app.pipelineAndMetrics"),
              url: href(
                "/organizations/:organizationSlug/pipeline-and-metrics",
                {
                  organizationSlug,
                },
              ),
            },
            {
              icon: IconCalendar,
              title: t("app.calendar"),
              url: href("/organizations/:organizationSlug/calendar", {
                organizationSlug,
              }),
            },
            {
              icon: IconBriefcase,
              title: t("app.jobsAndClients"),
              url: href("/organizations/:organizationSlug/jobs-and-clients", {
                organizationSlug,
              }),
            },
            {
              icon: IconFileText,
              title: t("app.jobSpecGenerator"),
              url: href("/organizations/:organizationSlug/job-spec-generator", {
                organizationSlug,
              }),
            },
            {
              icon: IconWallet,
              title: t("app.commission"),
              url: href("/organizations/:organizationSlug/commission", {
                organizationSlug,
              }),
            },
            {
              icon: IconVideo,
              title: t("app.videoCall"),
              url: href("/organizations/:organizationSlug/video-call", {
                organizationSlug,
              }),
            },
            {
              icon: IconFileText,
              title: t("app.cvFormatting"),
              url: href("/organizations/:organizationSlug/cv-formatting", {
                organizationSlug,
              }),
            },
            {
              icon: IconRobot,
              title: t("app.aiAssistant"),
              url: href("/organizations/:organizationSlug/ai-assistant", {
                organizationSlug,
              }),
            },
            {
              icon: IconSettings,
              title: t("app.settings"),
              url: href("/organizations/:organizationSlug/settings", {
                organizationSlug,
              }),
            },
            // {
            //   icon: FolderIcon,
            //   items: [
            //     {
            //       title: t("app.projects.all"),
            //       url: href("/organizations/:organizationSlug/projects", {
            //         organizationSlug,
            //       }),
            //     },
            //     {
            //       title: t("app.projects.active"),
            //       url: href(
            //         "/organizations/:organizationSlug/projects/active",
            //         {
            //           organizationSlug,
            //         },
            //       ),
            //     },
            //   ],
            //   title: t("app.projects.title"),
            // },
          ]}
          title={t("app.title")}
        />

        {billingSidebarCardProps && (
          <BillingSidebarCard
            className={cn(
              "mt-auto overflow-hidden transition-[opacity,transform,max-height] ease-in-out",
              "max-h-[500px] scale-100 opacity-100 delay-200 duration-500",
              "group-data-[variant=sidebar]:mx-2 group-data-[state=collapsed]:max-h-0 group-data-[state=collapsed]:scale-95 group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:delay-0 group-data-[state=collapsed]:duration-200",
            )}
            {...billingSidebarCardProps}
          />
        )}

        <NavGroup
          className={cn(!billingSidebarCardProps && "mt-auto")}
          items={[
            {
              icon: IconSettings,
              title: t("settings.organizationSettings"),
              url: href("/organizations/:organizationSlug/settings", {
                organizationSlug,
              }),
            },
            {
              icon: IconHelpCircle,
              title: t("settings.getHelp"),
              url: href("/organizations/:organizationSlug/get-help", {
                organizationSlug,
              }),
            },
          ]}
          size="sm"
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser {...navUserProps} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
