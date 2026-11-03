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

afterEach(cleanup);

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
