import { Fragment } from "react";
import { Link } from "react-router";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { ThemeToggle } from "~/features/color-scheme/theme-toggle";
import type { NotificationsButtonProps } from "~/features/notifications/notifications-button";
import { NotificationsButton } from "~/features/notifications/notifications-button";
import { useMediaQuery } from "~/hooks/use-media-query";

export type AppHeaderProps = {
  breadcrumbs?: {
    to: string;
    title: string;
  }[];
  notificationsButtonProps: NotificationsButtonProps;
};

const MOBILE_MAX_ITEMS = 2;
const DESKTOP_MAX_ITEMS = 4;

export function AppHeader({
  breadcrumbs = [],
  notificationsButtonProps,
}: AppHeaderProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Show ellipsis if:
  // - On mobile and more than 2 items, OR
  // - More than 4 items (regardless of screen size)
  const shouldShowEllipsis =
    (isMobile && breadcrumbs.length > MOBILE_MAX_ITEMS) ||
    breadcrumbs.length > DESKTOP_MAX_ITEMS;

  const firstItem = breadcrumbs[0];
  const lastItem = breadcrumbs[breadcrumbs.length - 1];
  const middleItems = breadcrumbs.slice(1, -1);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1.5" />

        <Separator
          className="mr-2 data-[orientation=vertical]:h-4"
          orientation="vertical"
        />

        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {shouldShowEllipsis ? (
                <>
                  {/* First item */}
                  {firstItem && (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to={firstItem.to}>{firstItem.title}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )}

                  {/* Ellipsis with dropdown for middle items */}
                  {middleItems.length > 0 && (
                    <>
                      <BreadcrumbItem>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Toggle menu"
                            className="flex items-center gap-1"
                          >
                            <BreadcrumbEllipsis className="size-4" />
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="start">
                            {middleItems.map((item) => (
                              <DropdownMenuItem asChild key={item.to}>
                                <Link to={item.to}>{item.title}</Link>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </>
                  )}

                  {/* Last item as page */}
                  {lastItem && (
                    <BreadcrumbItem>
                      <h1>
                        <BreadcrumbPage>{lastItem.title}</BreadcrumbPage>
                      </h1>
                    </BreadcrumbItem>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop: show up to 4 items */}
                  {breadcrumbs.map((breadcrumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                      <Fragment key={breadcrumb.to}>
                        <BreadcrumbItem>
                          {isLast ? (
                            <h1>
                              <BreadcrumbPage>
                                {breadcrumb.title}
                              </BreadcrumbPage>
                            </h1>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={breadcrumb.to}>{breadcrumb.title}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </Fragment>
                    );
                  })}
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="ml-auto flex items-center gap-2">
          <NotificationsButton {...notificationsButtonProps} />

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
