import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { NativeEngine } from '@/types/native-engine';

import { NativePreview } from './native-preview';

const PROJECT_ID = '0f6c4b9e-2d1a-4c3b-9e8f-7a6b5c4d3e2f';
const UNIWIND_PROJECT_ID = '5d2e8a14-7b3c-4f90-a1d6-3c8e9b0f2a47';

const url = vi.hoisted(() => ({ search: '' }));
const device = vi.hoisted(() => ({ ids: {} as Record<string, string | null> }));

vi.mock('next/navigation', () => ({
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

vi.mock('@/constants/native-preview-device', () => ({
  get EXPO_PROJECT_IDS(): Record<string, string | null> {
    return device.ids;
  },
  EXPO_GO_SDK: 58,
}));

beforeEach(() => {
  url.search = '';
  device.ids = { nativewind: PROJECT_ID, uniwind: UNIWIND_PROJECT_ID };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function renderPreview(engine: NativeEngine = 'nativewind'): void {
  render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <NativePreview engine={engine} name="button-demo" code="export {};" language="tsx" />
    </ThemeProvider>,
  );
}

function platformSelect(): HTMLElement {
  return screen.getByRole('combobox', { name: 'Platform' });
}

async function choosePlatform(label: string): Promise<void> {
  fireEvent.click(platformSelect());
  const listbox = await screen.findByRole('listbox');
  const option = within(listbox).getByRole('option', { name: label });
  // A press on an option, as a mouse makes it: Base UI takes a click as a pick only after the pointer went down on it.
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
}

describe('NativePreview', () => {
  it('names its platform picker, and shows the demo on the web until the reader picks another', () => {
    renderPreview();

    expect(platformSelect().textContent).toContain('Web');
    expect(screen.getByTitle('Button demo preview').tagName).toBe('IFRAME');
    expect(screen.queryByRole('img', { name: /QR code/ })).toBeNull();
  });

  it("shows a QR code and the link that open the demo in Expo Go in the page's style, once Native is picked", async () => {
    url.search = '?style=nova';
    renderPreview();

    await choosePlatform('Native');

    const link = `exp://u.expo.dev/${PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`;
    expect(
      screen.getByRole('img', {
        name: 'QR code that opens this demo in Expo Go',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Scan to preview.')).toBeTruthy();
    expect(screen.getByRole('link', { name: link }).getAttribute('href')).toBe(link);
    expect(screen.getByRole('button', { name: 'Copy the link' })).toBeTruthy();
    expect(screen.getByText(/Expo Go for SDK 58/)).toBeTruthy();
    expect(screen.queryByTitle('Button demo preview')).toBeNull();
  });

  it("frames a Uniwind page's demo with the Uniwind export, and opens it from the Uniwind project", async () => {
    url.search = '?style=nova';
    renderPreview('uniwind');

    expect(screen.getByTitle('Button demo preview').getAttribute('src')).toMatch(
      /^\/native-preview-uniwind\/index\.html\?style=nova&/,
    );

    await choosePlatform('Native');

    const link = `exp://u.expo.dev/${UNIWIND_PROJECT_ID}/--/button-demo?runtime-version=exposdk%3A58.0.0&channel-name=nova`;
    expect(screen.getByRole('link', { name: link }).getAttribute('href')).toBe(link);
  });

  it('offers no Native platform on a page whose engine has no Expo project, while the other engine has one', () => {
    device.ids.uniwind = null;

    renderPreview('uniwind');

    expect(screen.queryByRole('combobox', { name: 'Platform' })).toBeNull();
  });

  it('shows the web frame again once Web is picked back', async () => {
    renderPreview();
    await choosePlatform('Native');

    await choosePlatform('Web');

    expect(screen.getByTitle('Button demo preview').tagName).toBe('IFRAME');
    expect(screen.queryByRole('img', { name: /QR code/ })).toBeNull();
  });

  it('keeps the picked platform for the next native page', async () => {
    renderPreview();
    await choosePlatform('Native');
    cleanup();

    renderPreview();

    expect(platformSelect().textContent).toContain('Native');
    expect(screen.getByRole('img', { name: /QR code/ })).toBeTruthy();
  });

  it('offers no Native platform while the preview app has no Expo project, whatever the reader picked before', () => {
    localStorage.setItem('zui:native-preview-platform', 'native');
    device.ids.nativewind = null;

    renderPreview();

    expect(screen.queryByRole('combobox', { name: 'Platform' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Native' })).toBeNull();
    expect(screen.getByTitle('Button demo preview').tagName).toBe('IFRAME');
  });
});
