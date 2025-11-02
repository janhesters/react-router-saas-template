import type { LucideIcon } from "lucide-react";
import { ChevronRightIcon } from "lucide-react";
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
  icon?: LucideIcon;
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
                asChild
                className="group/collapsible"
                defaultOpen={isParentActive}
                key={item.title}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isParentActive}
                      size={size}
                      tooltip={item.title}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <NavLink end to={subItem.url}>
                            {({ isActive: childIsActive }) => (
                              <SidebarMenuSubButton
                                asChild
                                isActive={childIsActive}
                              >
                                <div>
                                  <span>{subItem.title}</span>
                                </div>
                              </SidebarMenuSubButton>
                            )}
                          </NavLink>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <NavLink to={item.url}>
                {({ isActive }) => (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    size={size}
                    tooltip={item.title}
                  >
                    <div>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </div>
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
