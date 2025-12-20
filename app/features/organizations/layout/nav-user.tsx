import {
  IconLogout,
  IconRosetteDiscountCheck,
  IconSelector,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Form, href, Link } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

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

export type NavUserProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
};

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation("organizations", {
    keyPrefix: "layout.navUser",
  });
  const hydrated = useHydrated();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                aria-label={t("userMenuButtonLabel")}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                // Playwright shouldn't try to click the button before it's hydrated
                disabled={!hydrated}
                size="lg"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
              <AvatarImage
                alt={user.name}
                className="rounded-lg"
                src={user.avatar}
              />

              <AvatarFallback className="rounded-lg">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <IconSelector className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="min-w-(--radix-dropdown-menu-trigger-width) max-w-(--radix-dropdown-menu-trigger-width) rounded-lg md:min-w-56 md:max-w-80"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                    <AvatarImage
                      alt={user.name}
                      className="rounded-lg"
                      src={user.avatar}
                    />

                    <AvatarFallback className="rounded-lg">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <Link to={href("/settings/account")}>
                <DropdownMenuItem>
                  <IconRosetteDiscountCheck />
                  {t("account")}
                </DropdownMenuItem>
              </Link>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <Form action="/logout" method="post" replace>
              <DropdownMenuItem
                render={
                  <button
                    className="w-full"
                    name="intent"
                    type="submit"
                    value="logout"
                  />
                }
              >
                <IconLogout />
                {t("logOut")}
              </DropdownMenuItem>
            </Form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
