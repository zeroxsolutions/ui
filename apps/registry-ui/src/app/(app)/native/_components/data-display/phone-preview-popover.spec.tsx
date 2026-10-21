import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PhonePreviewPopover } from './phone-preview-popover';

const PROJECT_ID = '0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';

const url = vi.hoisted(() => ({ search: '' }));

vi.mock('next/navigation', () => ({
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

beforeEach(() => {
  url.search = '';
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: 'Open on your phone' });
}

async function openPopover(): Promise<HTMLElement> {
  fireEvent.click(trigger());
  return screen.findByRole('dialog', { name: 'Open on your phone' });
}

describe('PhonePreviewPopover', () => {
  it('renders nothing while the preview app has no Expo project to open', () => {
    const { container } = render(<PhonePreviewPopover demo="button-demo" projectId={null} />);

    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it("opens on a QR code and a link to the demo in the page's style, with what to install", async () => {
    url.search = '?style=nova';
    render(<PhonePreviewPopover demo="button-demo" projectId={PROJECT_ID} />);

    const popover = await openPopover();

    const link = `exp://u.expo.dev/${PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`;
    expect(screen.getByRole('img', { name: /QR code/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: link }).getAttribute('href')).toBe(link);
    expect(screen.getByRole('button', { name: 'Copy the link' })).toBeTruthy();
    expect(popover.textContent).toContain('Expo Go for SDK 58');
  });

  it('links the default style where the page names none', async () => {
    render(<PhonePreviewPopover demo="button-demo" projectId={PROJECT_ID} />);

    await openPopover();

    expect(screen.getByRole('link', { name: /channel-name=vega$/ })).toBeTruthy();
  });

  it('moves focus into the popover as it opens, and back to its button as it closes', async () => {
    render(<PhonePreviewPopover demo="button-demo" projectId={PROJECT_ID} />);
    trigger().focus();

    const popover = await openPopover();
    await waitFor(() => expect(popover.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document.activeElement ?? popover, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger());
  });
});
