import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from './permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
import { CardDescription, CardHeader } from '@/registry/bases/base-ui/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/registry/bases/base-ui/ui/dropdown-menu';

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.getAnimations ??= () => [];
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const { pendingStart, pendingStop } = vi.hoisted(() => ({ pendingStart: vi.fn(), pendingStop: vi.fn() }));

vi.mock('@/registry/bases/base-ui/icons/circle-icon', async () => {
  const React = await import('react');
  return {
    CircleIcon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: pendingStart, stopAnimation: pendingStop }));
      return <svg data-testid="circle-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

const { deniedStart, deniedStop } = vi.hoisted(() => ({ deniedStart: vi.fn(), deniedStop: vi.fn() }));

vi.mock('@/registry/bases/base-ui/icons/circle-x-icon', async () => {
  const React = await import('react');
  return {
    CircleXIcon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: deniedStart, stopAnimation: deniedStop }));
      return <svg data-testid="circle-x-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

const { approvedStart, approvedStop } = vi.hoisted(() => ({ approvedStart: vi.fn(), approvedStop: vi.fn() }));

vi.mock('@/registry/bases/base-ui/icons/circle-check-icon', async () => {
  const React = await import('react');
  return {
    CircleCheckIcon: React.forwardRef<unknown, { 'aria-hidden'?: boolean }>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation: approvedStart, stopAnimation: approvedStop }));
      return <svg data-testid="circle-check-icon" aria-hidden={props['aria-hidden']} />;
    }),
  };
});

const all = [pendingStart, pendingStop, deniedStart, deniedStop, approvedStart, approvedStop];

afterEach(() => {
  cleanup();
  for (const fn of all) fn.mockClear();
});

describe('PermissionCard', () => {
  it('reflects status on the root for selector-driven coordination', () => {
    const { container, rerender } = render(
      <PermissionCard status="pending">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    const root = (): Element | null => container.firstElementChild;
    expect(root()?.getAttribute('data-status')).toBe('pending');

    rerender(
      <PermissionCard status="approved">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    expect(root()?.getAttribute('data-status')).toBe('approved');
  });

  it('is a small card unless the consumer sizes it', () => {
    const { container, rerender } = render(<PermissionCard status="pending" />);
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('sm');

    rerender(<PermissionCard status="pending" size="default" />);
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('default');
  });

  it('renders the consumer status word', () => {
    render(
      <PermissionCard status="denied">
        <CardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
          <PermissionCardStatus>Denied</PermissionCardStatus>
        </CardHeader>
      </PermissionCard>,
    );
    expect(screen.getByText('Denied')).toBeTruthy();
  });

  it('shows the upstream card description it composes in the header', () => {
    render(
      <PermissionCard status="pending">
        <CardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
          <CardDescription>Deploy the web app to production</CardDescription>
        </CardHeader>
      </PermissionCard>,
    );
    expect(screen.getByText('Deploy the web app to production')).toBeTruthy();
  });

  it('renders an asymmetric row: a plain Deny plus a graduated-scope split Allow', () => {
    render(
      <PermissionCard status="pending">
        <PermissionCardActions>
          <Button variant="ghost">Deny</Button>
          <ButtonGroup>
            <Button>Allow once</Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="icon" aria-label="More allow options" />} />
              <DropdownMenuContent align="end" className="w-auto">
                <DropdownMenuItem>Allow this session</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </PermissionCardActions>
      </PermissionCard>,
    );

    // Deny (1) + Allow action (1) + caret (1) = 3; Deny is a single button, the
    // caret rides the Allow side only.
    expect(screen.getAllByRole('button')).toHaveLength(3);
    screen.getByRole('button', { name: 'Deny' });
    screen.getByRole('button', { name: 'More allow options' });
  });

  it('persists a resolved outcome once the request is decided', () => {
    render(
      <PermissionCard status="approved">
        <PermissionCardResolved>Allowed once - 2:14pm</PermissionCardResolved>
      </PermissionCard>,
    );
    screen.getByText(/Allowed once/);
  });
});

describe('PermissionCardStatus icon', () => {
  const card = (status: 'pending' | 'approved' | 'denied') => (
    <PermissionCard status={status}>
      <PermissionCardStatus>word</PermissionCardStatus>
    </PermissionCard>
  );

  it.each(['pending', 'approved', 'denied'] as const)('plays no icon when the card is first drawn %s', (status) => {
    render(card(status));

    for (const fn of all) expect(fn).not.toHaveBeenCalled();
  });

  it('plays the new status icon once when the status flips, and stops the one it leaves', () => {
    const { rerender } = render(card('pending'));
    rerender(card('approved'));

    expect(approvedStart).toHaveBeenCalledTimes(1);
    expect(pendingStart).not.toHaveBeenCalled();
    expect(pendingStop).toHaveBeenCalledTimes(1);

    rerender(card('approved'));
    expect(approvedStart).toHaveBeenCalledTimes(1);

    rerender(card('denied'));
    expect(deniedStart).toHaveBeenCalledTimes(1);
    expect(approvedStop).toHaveBeenCalledTimes(1);
  });
});
