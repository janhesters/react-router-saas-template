import { href } from 'react-router';
import { describe, expect, test } from 'vitest';

import {
  createRoutesStub,
  render,
  screen,
  userEvent,
} from '~/test/react-test-utils';

import { pricesByTierAndInterval } from './billing-constants';
import { CreateSubscriptionModalContent } from './no-current-plan-modal-content';

describe('CreateSubscriptionModalContent component', () => {
  test('given: default state, should: render annual plans then switch to monthly correctly', async () => {
    const user = userEvent.setup();
    const RouterStub = createRoutesStub([
      { path: '/', Component: () => <CreateSubscriptionModalContent /> },
    ]);
    render(<RouterStub initialEntries={['/']} />);

    // should render the two billing period tabs
    const annualTab = screen.getByRole('tab', { name: 'Annual' });
    const monthlyTab = screen.getByRole('tab', { name: 'Monthly' });
    expect(annualTab).toHaveAttribute('aria-selected', 'true');
    expect(monthlyTab).toHaveAttribute('aria-selected', 'false');

    // should render three "Subscribe Now" buttons for annual plans
    const annualButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(annualButtons).toHaveLength(3);
    // and each should carry the correct priceId
    expect(annualButtons[0]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.low_annual.id,
    );
    expect(annualButtons[1]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.mid_annual.id,
    );
    expect(annualButtons[2]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.high_annual.id,
    );

    // should render the enterprise "Contact Sales" link
    expect(screen.getByRole('link', { name: 'Contact Sales' })).toHaveAttribute(
      'href',
      href('/contact-sales'),
    );

    // when switching to monthly
    await user.click(monthlyTab);

    // should update tab selection
    expect(monthlyTab).toHaveAttribute('aria-selected', 'true');
    expect(annualTab).toHaveAttribute('aria-selected', 'false');

    // should show the annual savings message
    expect(
      screen.getByText('Save up to 20% on the annual plan.'),
    ).toBeInTheDocument();

    // should render three "Subscribe Now" buttons for monthly plans
    const monthlyButtons = screen.getAllByRole('button', {
      name: 'Subscribe Now',
    });
    expect(monthlyButtons).toHaveLength(3);
    expect(monthlyButtons[0]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.low_monthly.id,
    );
    expect(monthlyButtons[1]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.mid_monthly.id,
    );
    expect(monthlyButtons[2]).toHaveAttribute(
      'value',
      pricesByTierAndInterval.high_monthly.id,
    );
  });
});
