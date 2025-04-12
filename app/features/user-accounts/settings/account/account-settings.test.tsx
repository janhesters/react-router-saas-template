import { faker } from '@faker-js/faker';
import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { AccountSettingsProps } from './account-settings';
import { AccountSettings } from './account-settings';

const createProps: Factory<AccountSettingsProps> = ({
  errors,
  isUpdatingUserAccount = false,
  user = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    imageUrl: faker.image.avatar(),
  },
} = {}) => ({ errors, isUpdatingUserAccount, user });

describe('AccountSettings Component', () => {
  test('given: component renders with default props, should: render account settings form with name, email (disabled), and avatar fields', () => {
    const props = createProps();
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <AccountSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are present
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const avatarInputMobile = screen.getByLabelText(/avatar/i); // Targets the input via label
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(avatarInputMobile).toBeInTheDocument(); // Check if file input exists
    expect(saveButton).toBeInTheDocument();

    // Verify initial values and states
    expect(nameInput).toHaveValue(props.user.name);
    expect(emailInput).toHaveValue(props.user.email);
    expect(emailInput).toBeDisabled(); // Crucial check
    expect(saveButton).toBeEnabled();
  });

  test('given: isUpdatingUserAccount is true, should: disable form and show loading state', () => {
    const props = createProps({ isUpdatingUserAccount: true });
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <AccountSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify form elements are disabled
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();

    // Check one of the file inputs for disabled state (use ID for robustness if label is ambiguous)
    // Note: Finding file inputs reliably can sometimes be tricky. Querying by role/test-id might be better if labels fail.
    // Let's assume getByLabelText works for the mobile input for now.
    expect(screen.getByLabelText(/avatar/i)).toBeDisabled();

    // Verify loading state in button
    const saveButton = screen.getByRole('button', { name: /saving changes/i });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent(/saving changes/i);
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument(); // Ensure original text isn't there
  });

  test('given: form has errors, should: display error messages', () => {
    const errors = {
      name: {
        type: 'manual', // Or 'validation'
        message: 'settings:user-account.form.name-min-length',
      },
    };
    const props = createProps({ errors });
    const path = '/settings/account';
    const RouterStub = createRoutesStub([
      { path, Component: () => <AccountSettings {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    // Verify error message is displayed (using the mocked translation)
    expect(
      screen.getByText(/name must be at least 2 characters./i),
    ).toBeInTheDocument();

    // Optional: Check aria-invalid attribute on the input
    expect(screen.getByLabelText(/name/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
