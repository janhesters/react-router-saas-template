import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import type { EmailInviteCardProps } from "./invite-by-email-card";
import { EmailInviteCard } from "./invite-by-email-card";
import { createPopulatedOrganization } from "~/features/organizations/organizations-factories.server";
import {
  createRoutesStub,
  render,
  screen,
  userEvent,
  waitFor,
} from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<EmailInviteCardProps> = ({
  currentUserIsOwner = false,
  lastResult,
  isInvitingByEmail = false,
  organizationIsFull = false,
} = {}) => ({
  currentUserIsOwner,
  isInvitingByEmail,
  lastResult,
  organizationIsFull,
});

const originalHasPointerCapture = (pointerId: number) =>
  globalThis.HTMLElement.prototype.hasPointerCapture.call(
    globalThis.HTMLElement.prototype,
    pointerId,
  );

beforeAll(() => {
  globalThis.HTMLElement.prototype.hasPointerCapture = vi.fn();
});

afterAll(() => {
  globalThis.HTMLElement.prototype.hasPointerCapture =
    originalHasPointerCapture;
});

describe("EmailInviteCard Component", () => {
  test("given: component renders, should: display card with title, description, and form elements", () => {
    const props = createProps();
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <EmailInviteCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify card title and description
    expect(screen.getByText(/invite by email/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /enter your colleagues' email addresses, and we'll send them a personalized invitation to join your organization. you can also choose the role they'll join with./i,
      ),
    ).toBeInTheDocument();

    // Verify form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send email invitation/i }),
    ).toBeInTheDocument();
  });

  test("given: isInvitingByEmail is true, should: disable form and show loading state", () => {
    const props = createProps({ isInvitingByEmail: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <EmailInviteCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();

    // Verify loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
  });

  // Note: Validation error display is tested in the integration tests (members.spec.ts)
  // as it requires a properly structured SubmissionResult from Conform which is complex to mock

  test("given: current user is NOT an owner, should: not show owner role option", async () => {
    const props = createProps({ currentUserIsOwner: false });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <EmailInviteCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open the select dropdown
    const select = screen.getByRole("combobox", { name: /role/i });
    await userEvent.click(select);

    // Wait for dropdown to open and verify owner option is not present
    await waitFor(() => {
      expect(screen.queryByRole("option", { name: /owner/i })).toBeNull();
    });
  });

  test("given: current user is an owner, should: show owner role option", async () => {
    const props = createProps({ currentUserIsOwner: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <EmailInviteCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Open the select dropdown
    const select = screen.getByRole("combobox", { name: /role/i });
    await userEvent.click(select);

    // Wait for dropdown to open and verify owner option is present
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: /owner/i }),
      ).toBeInTheDocument();
    });
  });

  test("given: organization is full, should: disable form", () => {
    const props = createProps({ organizationIsFull: true });
    const { slug } = createPopulatedOrganization();
    const path = `/organizations/${slug}/settings/team-members`;
    const RouterStub = createRoutesStub([
      { Component: () => <EmailInviteCard {...props} />, path },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form is disabled
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/role/i)).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
