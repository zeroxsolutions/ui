import { ThemeProvider } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';
import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { expoGoUrl, nativePreviewTitle } from '../../lib/native-preview';

import { NativePreview } from './native-preview';

const device = vi.hoisted(() => ({ ids: {} as Record<string, string | null> }));

vi.mock('../../constants/native-preview-device', async (importActual) => ({
  ...(await importActual<typeof import('../../constants/native-preview-device')>()),
  EXPO_PROJECT_IDS: device.ids,
}));

// The engines' real projects, until a case takes one away.
beforeEach(async () => {
  const actual = await vi.importActual<typeof import('../../constants/native-preview-device')>(
    '../../constants/native-preview-device',
  );
  // In place: the mocked module holds this one object.
  Object.assign(device.ids, actual.EXPO_PROJECT_IDS);
});

afterEach(() => {
  localStorage.clear();
});

async function renderPreview(engine: NativeEngine = 'nativewind', search = '') {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TestHost search={search}>
        <NativePreview engine={engine} name="button-demo" code="export {};" language="tsx" />
      </TestHost>
    </ThemeProvider>,
  );
}

async function choosePlatform(label: string): Promise<void> {
  await userEvent.click(page.getByRole('combobox', { name: 'Platform' }));
  await userEvent.click(page.getByRole('option', { name: label }));
}

const qrCode = () => page.getByRole('img', { name: 'QR code that opens this demo in Expo Go' });
const webFrame = () => page.getByTitle(nativePreviewTitle('button-demo'));

describe('NativePreview', () => {
  it('names its platform picker, and shows the demo on the web until the reader picks another', async () => {
    await renderPreview();

    await expect.element(page.getByRole('combobox', { name: 'Platform' })).toHaveTextContent('Web');
    await expect.element(webFrame()).toBeInTheDocument();
    await expect.element(qrCode()).not.toBeInTheDocument();
  });

  it('offers no Native platform on a page whose engine has no Expo project, while the other engine has one', async () => {
    device.ids.uniwind = null;

    await renderPreview('uniwind');

    await expect.element(webFrame()).toBeInTheDocument();
    await expect.element(page.getByRole('combobox', { name: 'Platform' })).not.toBeInTheDocument();
  });

  it('offers no Native platform while the preview app has no Expo project, whatever the reader picked before', async () => {
    localStorage.setItem('zui:native-preview-platform', 'native');
    device.ids.nativewind = null;

    await renderPreview();

    await expect.element(webFrame()).toBeInTheDocument();
    await expect.element(page.getByRole('combobox', { name: 'Platform' })).not.toBeInTheDocument();
  });

  it("shows a QR code and the link that open the demo in Expo Go in the page's style, once Native is picked", async () => {
    await renderPreview('nativewind', 'style=nova');

    await choosePlatform('Native');

    const link = expoGoUrl({ engine: 'nativewind', style: 'nova', demo: 'button-demo' });
    await expect.element(qrCode()).toBeVisible();
    await expect.element(page.getByRole('link', { name: link! })).toHaveAttribute('href', link);
    await expect.element(webFrame()).not.toBeInTheDocument();
  });

  it("opens a Uniwind page's demo from the Uniwind project", async () => {
    await renderPreview('uniwind', 'style=nova');

    await choosePlatform('Native');

    const link = expoGoUrl({ engine: 'uniwind', style: 'nova', demo: 'button-demo' });
    await expect.element(page.getByRole('link', { name: link! })).toHaveAttribute('href', link);
  });

  it('shows the web frame again once Web is picked back', async () => {
    await renderPreview();
    await choosePlatform('Native');
    await expect.element(qrCode()).toBeVisible();

    await choosePlatform('Web');

    await expect.element(webFrame()).toBeInTheDocument();
    await expect.element(qrCode()).not.toBeInTheDocument();
  });

  it('keeps the picked platform for the next native page', async () => {
    const first = await renderPreview();
    await choosePlatform('Native');
    await expect.element(qrCode()).toBeVisible();
    await first.unmount();

    await renderPreview();

    await expect.element(qrCode()).toBeVisible();
  });
});
