import { describe, expect, test } from "vitest";

import { createPopulatedOrganization } from "../organizations-factories.server";
import type { AcceptEmailInvitePageProps } from "./accept-email-invite-page";
import { AcceptEmailInvitePage } from "./accept-email-invite-page";
import { createPopulatedUserAccount } from "~/features/user-accounts/user-accounts-factories.server";
import { createRoutesStub, render, screen } from "~/test/react-test-utils";
import type { Factory } from "~/utils/types";

const createProps: Factory<AcceptEmailInvitePageProps> = ({
  inviterName = createPopulatedUserAccount().name,
  organizationName = createPopulatedOrganization().name,
  ...props
} = {}) => ({ inviterName, organizationName, ...props });

describe("AcceptEmailInvitePage component", () => {
  test("given: an organization name and an inviter name, should: render a greeting and a button to accept the invite", () => {
    const props = createProps();
    const path = `/organizations/invite-email`;
    const RemixStub = createRoutesStub([
      {
        Component: () => <AcceptEmailInvitePage {...props} />,
        path,
      },
    ]);

    render(<RemixStub initialEntries={[path]} />);

    // It renders a greeting.
    expect(
      screen.getByText(/welcome to react router saas template/i),
    ).toBeInTheDocument();
    const escapedInviter = props.inviterName.replace("'", "&#39;");
    const escapedOrg = props.organizationName.replace("'", "&#39;");
    expect(
      screen.getByText(
        new RegExp(`${escapedInviter} invites you to join ${escapedOrg}`, "i"),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /click the button below to sign up. by using this email invite you will automatically join the correct organization./i,
      ),
    ).toBeInTheDocument();

    // It renders a button to accept the invite.
    expect(
      screen.getByRole("button", { name: /accept invite/i }),
    ).toHaveAttribute("type", "submit");
  });
});
