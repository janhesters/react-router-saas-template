import type { Icon } from "@tabler/icons-react";
import { IconChevronRight } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { NavLink, useLocation } from "react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";

type NavGroupItem = {
  title: string;
  icon?: Icon;
  isActive?: boolean;
};

export type NavGroupItemWithoutChildren = NavGroupItem & {
  url: string;
};

type NavGroupItemWithChildren = NavGroupItem & {
  items: {
    isActive?: boolean;
    title: string;
    url: string;
  }[];
};

export type NavGroupProps = {
  className?: string;
  items: (NavGroupItemWithoutChildren | NavGroupItemWithChildren)[];
  size?: ComponentProps<typeof SidebarMenuButton>["size"];
  title?: string;
};

export function NavGroup({ className, items, size, title }: NavGroupProps) {
  const location = useLocation();

  return (
    <SidebarGroup className={className}>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}

      <SidebarMenu>
        {items.map((item) => {
          if ("items" in item) {
            const isParentActive = item.items.some(
              (subItem) => location.pathname === subItem.url,
            );

            return (
              <Collapsible
                className="group/collapsible"
                defaultOpen={isParentActive}
                key={item.title}
                render={<SidebarMenuItem />}
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton
                      isActive={isParentActive}
                      size={size}
                      tooltip={item.title}
                    />
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <NavLink end to={subItem.url}>
                          {({ isActive: childIsActive }) => (
                            <SidebarMenuSubButton isActive={childIsActive}>
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          )}
                        </NavLink>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    isActive={isActive}
                    size={size}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
              </NavLink>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
