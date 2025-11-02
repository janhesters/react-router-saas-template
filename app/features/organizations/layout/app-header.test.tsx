/** biome-ignore-all lint/style/noNonNullAssertion: Test code */
import { describe, expect, test } from "vitest";

import type { AppHeaderProps } from "./app-header";
import { AppHeader } from "./app-header";
import { SidebarProvider } from "~/components/ui/sidebar";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<AppHeaderProps> = ({
  title,
  notificationsButtonProps = {
    allNotifications: [],
    showBadge: false,
    unreadNotifications: [],
  },
} = {}) => ({ notificationsButtonProps, title });

describe("AppHeader Component", () => {
  test("given: a title, should: render header with title and notification button", () => {
    const props = createProps({ title: "Test Title" });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify the title is displayed
    expect(
      screen.getByRole("heading", { level: 1, name: props.title! }),
    ).toBeInTheDocument();

    // Verify the notification button is present
    const notificationButton = screen.getByRole("button", {
      name: /open notifications/i,
    });
    expect(notificationButton).toBeInTheDocument();
    expect(notificationButton).toHaveClass("size-8");
  });

  test("given: no title, should: render header without title but with notification button", () => {
    const props = createProps({ title: undefined });
    const path = "/test";
    const RouterStub = createRoutesStub([
      { Component: () => <AppHeader {...props} />, path },
    ]);

    render(
      <SidebarProvider>
        <RouterStub initialEntries={[path]} />
      </SidebarProvider>,
    );

    // Verify the title is not displayed
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();

    // Verify the notification button is still present
    const notificationButton = screen.getByRole("button", {
      name: /open notifications/i,
    });
    expect(notificationButton).toBeInTheDocument();
  });
});
