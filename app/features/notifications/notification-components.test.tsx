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
import { LinkNotification } from './notification-components';
import { LINK_NOTIFICATION_TYPE } from './notification-constants';

const createLinkNotificationProps: Factory<LinkNotificationProps> = ({
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

describe('LinkNotification', () => {
  test('given: unread notification, should: show unread indicator and menu', () => {
    const notification = createLinkNotificationProps({ isRead: false });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <LinkNotification {...notification} /> },
    ]);

    render(<RouterStub />);

    // The dot should be visible
    expect(
      screen.getByRole('button', { name: /open notification menu/i }),
    ).toBeInTheDocument();
  });

  test('given: read notification, should: not show unread indicator or menu', () => {
    const notification = createLinkNotificationProps({ isRead: true });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <LinkNotification {...notification} /> },
    ]);

    render(<RouterStub />);

    // Neither dot nor menu should be visible
    expect(
      screen.queryByRole('button', { name: /open notification menu/i }),
    ).not.toBeInTheDocument();
  });

  test('given: user clicks notification, should: navigate to href', () => {
    const notification = createLinkNotificationProps();
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <LinkNotification {...notification} /> },
    ]);

    render(<RouterStub />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', notification.href);
    expect(link).toHaveTextContent(notification.text);
  });

  test('given: unread notification and user clicks mark as read, should: call onMarkAsRead', async () => {
    const onMarkAsRead = vi.fn();
    const notification = createLinkNotificationProps({
      isRead: false,
      onMarkAsRead,
    });
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <LinkNotification {...notification} /> },
    ]);

    const user = userEvent.setup();
    render(<RouterStub />);

    // Open menu and click mark as read
    const menuButton = screen.getByRole('button', {
      name: /open notification menu/i,
    });
    await user.click(menuButton);
    await user.click(screen.getByText(/mark as read/i));

    expect(onMarkAsRead).toHaveBeenCalled();
  });
});
