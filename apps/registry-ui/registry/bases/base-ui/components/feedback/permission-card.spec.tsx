import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from './permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ButtonGroup } from '@/registry/bases/base-ui/ui/button-group';
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

afterEach(cleanup);

const root = () => document.querySelector('[data-slot="permission-card"]') as HTMLElement;

describe('PermissionCard', () => {
  it('reflects status on the root for selector-driven coordination', () => {
    const { rerender } = render(
      <PermissionCard status="pending">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    expect(root().getAttribute('data-status')).toBe('pending');

    rerender(
      <PermissionCard status="approved">
        <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
      </PermissionCard>,
    );
    expect(root().getAttribute('data-status')).toBe('approved');
  });

  it('shows the per-status badge label', () => {
    render(
      <PermissionCard status="pending">
        <PermissionCardStatus status="pending" />
      </PermissionCard>,
    );
    screen.getByText('Needs approval');
    cleanup();

    render(
      <PermissionCard status="approved">
        <PermissionCardStatus status="approved" />
      </PermissionCard>,
    );
    screen.getByText('Allowed');
    cleanup();

    render(
      <PermissionCard status="denied">
        <PermissionCardStatus status="denied" />
      </PermissionCard>,
    );
    screen.getByText('Denied');
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
        <PermissionCardResolved>Allowed once · 2:14pm</PermissionCardResolved>
      </PermissionCard>,
    );
    screen.getByText(/Allowed once/);
  });
});
