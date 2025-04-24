import { faker } from '@faker-js/faker';
import { createId } from '@paralleldrive/cuid2';
import { describe, expect, test, vi } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { LinkNotificationProps } from './notification-components';
import { LINK_NOTIFICATION_TYPE } from './notification-constants';
import type { NotificationsButtonProps } from './notifications-button';
import { NotificationsButton } from './notifications-button';

const createLinkNotification: Factory<LinkNotificationProps> = ({
  id = createId(),
  text = faker.lorem.sentence(),
  href = faker.internet.url(),
  isRead = false,
  onMarkAsRead = vi.fn(),
} = {}) => ({
  id,
  type: LINK_NOTIFICATION_TYPE,
  text,
  href,
  isRead,
  onMarkAsRead,
});

const createProps: Factory<NotificationsButtonProps> = ({
  allNotifications = [],
  hasUnreadNotifications = false,
  unreadNotifications = [],
} = {}) => ({
  allNotifications,
  hasUnreadNotifications,
  unreadNotifications,
});

describe('NotificationsButton component', () => {
  test('given: no unread notifications, should: render button with default aria label', () => {
    const props = createProps();
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', { name: /open notifications/i });
    expect(button).toBeInTheDocument();
  });

  test('given: unread notifications, should: render button with unread notifications aria label', () => {
    const props = createProps({ hasUnreadNotifications: true });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', {
      name: /open unread notifications/i,
    });
    expect(button).toBeInTheDocument();
  });

  test('given: button clicked, should: open notifications panel with unread tab selected by default', async () => {
    const user = userEvent.setup();
    const props = createProps({
      allNotifications: [createLinkNotification({ text: 'All notification' })],
      unreadNotifications: [
        createLinkNotification({ text: 'Unread notification' }),
      ],
    });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    const button = screen.getByRole('button', { name: /open notifications/i });
    await user.click(button);

    // Check that panel is open with tabs
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  test('given: notifications panel open, should: allow switching between tabs', async () => {
    const user = userEvent.setup();
    const allNotification = createLinkNotification({
      text: 'All notification',
    });
    const unreadNotification = createLinkNotification({
      text: 'Unread notification',
    });
    const props = createProps({
      allNotifications: [allNotification],
      unreadNotifications: [unreadNotification],
    });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Open panel
    await user.click(
      screen.getByRole('button', { name: /open notifications/i }),
    );

    // Verify unread tab is selected by default and shows unread notification
    expect(screen.getByRole('tab', { name: /unread/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText(unreadNotification.text)).toBeInTheDocument();

    // Switch to all tab
    await user.click(screen.getByRole('tab', { name: /all/i }));
    expect(screen.getByRole('tab', { name: /all/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText(allNotification.text)).toBeInTheDocument();
  });

  test('given: notifications panel open, should: show mark all as read button', async () => {
    const user = userEvent.setup();
    const onMarkAllAsRead = vi.fn();
    const props = createProps({
      allNotifications: [createLinkNotification({ text: 'All notification' })],
      unreadNotifications: [
        createLinkNotification({ text: 'Unread notification' }),
      ],
      hasUnreadNotifications: true,
      onMarkAllAsRead,
    });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <NotificationsButton {...props} /> },
    ]);

    render(<RouterStub initialEntries={['/']} />);

    // Open panel
    await user.click(
      screen.getByRole('button', { name: /open unread notifications/i }),
    );

    // Check mark all as read button exists
    const markAllButton = screen.getByRole('button', {
      name: /mark all as read/i,
    });
    expect(markAllButton).toBeInTheDocument();
  });
});
