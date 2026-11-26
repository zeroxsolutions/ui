import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { expectPlaying, expectStill, drawingIn, playMotion } from '../../../../../test/motion';
import {
  PermissionCard,
  PermissionCardActions,
  PermissionCardResolved,
  PermissionCardStatus,
  PermissionCardTitle,
} from './permission-card';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CardDescription, CardHeader } from '@/registry/bases/base-ui/ui/card';

type Status = 'pending' | 'approved' | 'denied';

const ICONS = { pending: 'circle-icon', approved: 'circle-check-icon', denied: 'circle-x-icon' } as const;

describe('PermissionCard', () => {
  it('renders the consumer status word', async () => {
    await render(
      <PermissionCard status="denied">
        <CardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
          <PermissionCardStatus>Denied</PermissionCardStatus>
        </CardHeader>
      </PermissionCard>,
    );
    await expect.element(page.getByText('Denied')).toBeVisible();
  });

  it('shows the upstream card description it composes in the header', async () => {
    await render(
      <PermissionCard status="pending">
        <CardHeader>
          <PermissionCardTitle>Run deploy.sh</PermissionCardTitle>
          <CardDescription>Deploy the web app to production</CardDescription>
        </CardHeader>
      </PermissionCard>,
    );
    await expect.element(page.getByText('Deploy the web app to production')).toBeVisible();
  });

  it('offers its decision only while the request is pending, then shows the outcome', async () => {
    const card = (status: Status) => (
      <PermissionCard status={status}>
        <PermissionCardActions>
          <Button variant="ghost">Deny</Button>
        </PermissionCardActions>
        <PermissionCardResolved>Allowed once - 2:14pm</PermissionCardResolved>
      </PermissionCard>
    );
    const screen = await render(card('pending'));
    await expect.element(page.getByRole('button', { name: 'Deny' })).toBeVisible();
    await expect.element(page.getByText(/Allowed once/)).not.toBeVisible();

    await screen.rerender(card('approved'));

    await expect.element(page.getByText('Deny')).not.toBeVisible();
    await expect.element(page.getByText(/Allowed once/)).toBeVisible();
  });
});

describe('PermissionCardStatus icon', () => {
  playMotion();

  const card = (status: Status) => (
    <PermissionCard status={status}>
      <PermissionCardStatus>word</PermissionCardStatus>
    </PermissionCard>
  );

  it.each(['pending', 'approved', 'denied'] as const)('shows only the icon of a %s request', async (status) => {
    await render(card(status));

    for (const [shown, slot] of Object.entries(ICONS)) {
      const icon = expect.element(page.getByTestId(slot));
      await (shown === status ? icon.toBeVisible() : icon.not.toBeVisible());
    }
  });

  it.each(['pending', 'approved', 'denied'] as const)(
    'plays no icon when the card is first drawn %s',
    async (status) => {
      await render(card(status));

      await expectStill(page.getByTestId(ICONS[status]).element());
    },
  );

  it('plays the new status icon as the status flips', async () => {
    const screen = await render(card('pending'));
    const approved = page.getByTestId(ICONS.approved);
    const rest = drawingIn(approved.element());

    await screen.rerender(card('approved'));

    await expectPlaying(approved.element(), rest);
  });
});
