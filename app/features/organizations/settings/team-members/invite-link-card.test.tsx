import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

import {
  createPopulatedOrganization,
  createPopulatedOrganizationInviteLink,
} from "../../organizations-factories.server";
import type { InviteLinkCardProps } from "./invite-link-card";
import { InviteLinkCard } from "./invite-link-card";
import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

vi.mock("copy-to-clipboard", () => ({ default: vi.fn() }));

const createProps: Factory<InviteLinkCardProps> = ({
  inviteLink = {
    expiryDate: createPopulatedOrganizationInviteLink().expiresAt.toISOString(),
    href: faker.internet.url(),
  },
  ...props
} = {}) => ({ inviteLink, ...props });

describe("TeamMembersInviteLinkCard component", () => {
  test("given no invite link: renders the correct heading, description and a button to create a new invite link", () => {
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const props = createProps();
    const RemixStub = createRoutesStub([
      {
        Component: () => <InviteLinkCard {...props} inviteLink={undefined} />,
        path,
      },
    ]);

    render(<RemixStub initialEntries={[path]} />);

    // It renders the correct heading and description.
    expect(screen.getByText(/share an invite link/i)).toBeInTheDocument();
    expect(screen.getByText(/valid for 48 hours/i)).toBeInTheDocument();

    // It renders a button to generate a new invite link.
    expect(
      screen.getByRole("button", { name: /create new invite link/i }),
    ).toHaveAttribute("type", "submit");
  });

  test("given an invite link: renders the correct heading, description, a button re-generate the invite link, a button to deactivate the invite link and button to copy the invite link", async () => {
    const user = userEvent.setup();
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const props = createProps({
      inviteLink: {
        expiryDate: "2025-03-28T12:00:00.000Z",
        href: faker.internet.url(),
      },
    });
    const RemixStub = createRoutesStub([
      {
        Component: () => <InviteLinkCard {...props} />,
        path,
      },
    ]);

    render(<RemixStub initialEntries={[path]} />);

    // It renders the correct heading and description.
    expect(screen.getByText(/share an invite link/i)).toBeInTheDocument();
    expect(screen.getByText(/valid for 48 hours/i)).toBeInTheDocument();

    // It renders the invite link, a button to copy the link, a button to
    // regenerate it and a button to deactivate it.
    await user.click(screen.getByRole("button", { name: /copy invite link/i }));
    expect(
      screen.getByRole("button", { name: /invite link copied/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /regenerate link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /deactivate link/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /go to the invite link's page/i }),
    ).toHaveAttribute("href", props.inviteLink?.href);
    expect(
      screen.getByText(/Your link is valid until Friday, March 28, 2025/i),
    ).toBeInTheDocument();
  });

  test("given: organization is full and no invite link, should: disable form", () => {
    const props = createProps({ organizationIsFull: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      {
        Component: () => <InviteLinkCard {...props} inviteLink={undefined} />,
        path,
      },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(
      screen.getByRole("button", { name: /create new invite link/i }),
    ).toBeDisabled();
  });

  test("given: organization is full and has an invite link, should: disable form", () => {
    const props = createProps({ organizationIsFull: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <InviteLinkCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(
      screen.getByRole("button", { name: /regenerate link/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /deactivate link/i }),
    ).toBeEnabled();
  });
});
