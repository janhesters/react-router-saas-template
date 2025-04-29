import { formatDate } from 'date-fns';
import { describe, expect, test } from 'vitest';

import { createRoutesStub, render, screen } from '~/test/react-test-utils';
import type { Factory } from '~/utils/types';

import type { BillingSidebarCardProps } from './billing-sidebar-card';
import { BillingSidebarCard } from './billing-sidebar-card';

const createProps: Factory<BillingSidebarCardProps> = ({
  freeTrialIsActive = true,
  showButton = true,
  trialEndDate = new Date('2024-12-31'),
} = {}) => ({ freeTrialIsActive, showButton, trialEndDate });

describe('BillingSidebarCard component', () => {
  test('given: free trial is active, should: show active trial message with end date', () => {
    const props = createProps({
      freeTrialIsActive: true,
      trialEndDate: new Date('2024-12-31'),
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/business plan \(trial\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(formatDate(props.trialEndDate, 'MMMM dd, yyyy'), 'i'),
      ),
    ).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('given: free trial has ended, should: show trial ended message with end date', () => {
    const props = createProps({
      freeTrialIsActive: false,
      trialEndDate: new Date('2024-12-31'),
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.getByText(/business plan \(trial\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(formatDate(props.trialEndDate, 'MMMM dd, yyyy'), 'i'),
      ),
    ).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('given: showButton is false, should: not show manage subscription button', () => {
    const props = createProps({
      showButton: false,
    });
    const path = '/test';
    const RouterStub = createRoutesStub([
      { path, Component: () => <BillingSidebarCard {...props} /> },
    ]);

    render(<RouterStub initialEntries={[path]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
