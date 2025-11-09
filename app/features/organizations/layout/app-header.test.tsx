import { describe, expect, test } from "vitest";

import type { AppHeaderProps } from "./app-header";
import { AppHeader } from "./app-header";
import { SidebarProvider } from "~/components/ui/sidebar";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<AppHeaderProps> = ({
  breadcrumbs,
  notificationsButtonProps = {
    allNotifications: [],
    showBadge: false,
    unreadNotifications: [],
  },
} = {}) => ({ breadcrumbs, notificationsButtonProps });

describe("AppHeader Component", () => {
  test("given: breadcrumbs, should: render header with breadcrumbs and notification button", () => {
    const breadcrumbs = [
      { title: "Home", to: "/" },
      { title: "Dashboard", to: "/dashboard" },
      { title: "Settings", to: "/settings" },
    ];
    const props = createProps({ breadcrumbs });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify breadcrumb links are displayed as clickable anchor elements
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.tagName).toBe("A");

    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.tagName).toBe("A");

    // Verify last breadcrumb is displayed as h1 heading with page span inside
    const settingsHeading = screen.getByRole("heading", {
      level: 1,
      name: "Settings",
    });
    expect(settingsHeading).toBeInTheDocument();

    // Verify the page span inside the h1 has the correct attributes
    const settingsPage = screen.getByText("Settings");
    expect(settingsPage).toHaveAttribute("aria-current", "page");
    expect(settingsPage).toHaveAttribute("aria-disabled", "true");
    expect(settingsPage.tagName).toBe("SPAN");

    // Verify the notification button is present
    const notificationButton = screen.getByRole("button", {
      name: /open notifications/i,
    });
    expect(notificationButton).toBeInTheDocument();
    expect(notificationButton).toHaveClass("size-8");
  });

  test("given: no breadcrumbs, should: render header without breadcrumbs but with notification button", () => {
    const props = createProps({ breadcrumbs: undefined });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify the breadcrumbs are not displayed
    expect(
      screen.queryByRole("navigation", { name: "breadcrumb" }),
    ).not.toBeInTheDocument();

    // Verify the notification button is still present
    const notificationButton = screen.getByRole("button", {
      name: /open notifications/i,
    });
    expect(notificationButton).toBeInTheDocument();
  });

  test("given: empty breadcrumbs array, should: render header without breadcrumbs", () => {
    const props = createProps({ breadcrumbs: [] });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify the breadcrumbs are not displayed
    expect(
      screen.queryByRole("navigation", { name: "breadcrumb" }),
    ).not.toBeInTheDocument();
  });

  test("given: single breadcrumb, should: render as h1 heading without clickable link", () => {
    const breadcrumbs = [{ title: "Home", to: "/" }];
    const props = createProps({ breadcrumbs });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify single breadcrumb is displayed as h1 heading
    const homeHeading = screen.getByRole("heading", { level: 1, name: "Home" });
    expect(homeHeading).toBeInTheDocument();

    // Verify the page span inside the h1 has the correct attributes
    const homePage = screen.getByText("Home");
    expect(homePage).toHaveAttribute("aria-current", "page");
    expect(homePage).toHaveAttribute("aria-disabled", "true");
    expect(homePage.tagName).toBe("SPAN");
  });
});
