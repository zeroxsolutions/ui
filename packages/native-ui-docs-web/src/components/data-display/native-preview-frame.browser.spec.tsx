import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render, type RenderResult } from 'vitest-browser-react';

import { DEFAULT_PLATFORM_STYLE } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { TestHost } from '@zeroxsolutions/ui/test/test-host';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

import { NATIVE_PREVIEW_HEIGHT_MESSAGE, nativePreviewSrc, nativePreviewTitle } from '../../lib/native-preview';

import { NativePreviewFrame } from './native-preview-frame';

// The browser project serves src/test/public: its native preview posts its height for `button-demo`, and for
// `silent-demo` mounts and posts nothing. No Uniwind export is served there, so a Uniwind frame loads a 404.

interface FrameOptions {
  engine?: NativeEngine;
  /** The page's query, without its `?`. */
  search?: string;
  theme?: 'light' | 'dark';
}

function frameAt(demo: string, { engine = 'nativewind', search = '', theme = 'light' }: FrameOptions = {}): ReactNode {
  return (
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
      <TestHost search={search}>
        <NativePreviewFrame engine={engine} demo={demo} />
      </TestHost>
    </ThemeProvider>
  );
}

function renderFrame(demo: string, options?: FrameOptions): Promise<RenderResult> {
  return render(frameAt(demo, options));
}

const loading = () => page.getByRole('status', { name: 'Loading the preview' });
const failure = () => page.getByRole('alert');

describe('NativePreviewFrame', () => {
  it("frames the demo in the page's style and the site's mode", async () => {
    await renderFrame('button-demo', { search: 'style=nova', theme: 'dark' });

    await expect
      .element(page.getByTitle(nativePreviewTitle('button-demo')))
      .toHaveAttribute(
        'src',
        nativePreviewSrc({ engine: 'nativewind', style: 'nova', demo: 'button-demo', theme: 'dark' }),
      );
  });

  it('frames the default style in light where the page names no style and the site is light', async () => {
    await renderFrame('button-demo');

    await expect
      .element(page.getByTitle(nativePreviewTitle('button-demo')))
      .toHaveAttribute(
        'src',
        nativePreviewSrc({
          engine: 'nativewind',
          style: DEFAULT_PLATFORM_STYLE.native,
          demo: 'button-demo',
          theme: 'light',
        }),
      );
  });

  it('stops showing it is loading, and lets the frame be reached, once the preview posts its height', async () => {
    await renderFrame('button-demo');

    await expect.element(loading()).not.toBeInTheDocument();
    await expect.element(page.getByTitle(nativePreviewTitle('button-demo'))).not.toHaveAttribute('inert');
    await expect.element(failure()).not.toBeInTheDocument();
  });

  it('says the preview did not load as soon as the frame holds a page with no preview in it', async () => {
    await renderFrame('button-demo', { engine: 'uniwind' });

    await expect.element(failure()).toHaveTextContent('The preview did not load');
  });

  it('keeps waiting for the height once a page holding the preview has loaded', async () => {
    await renderFrame('silent-demo');

    const frame = page.frameLocator(page.getByTitle(nativePreviewTitle('silent-demo')));
    await expect.element(frame.getByText('Not drawn yet')).toBeVisible();
    await expect.element(loading()).toBeInTheDocument();
    await expect.element(failure()).not.toBeInTheDocument();
  });

  it('takes no height from a message another window posts', async () => {
    const { rerender } = await renderFrame('silent-demo');
    const frame = page.frameLocator(page.getByTitle(nativePreviewTitle('silent-demo')));
    await expect.element(frame.getByText('Not drawn yet')).toBeVisible();

    const delivered = new Promise((resolve) => window.addEventListener('message', resolve, { once: true }));
    window.postMessage({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 148 }, window.location.origin);
    await delivered;
    // A render of the same tree applies whatever update the message queued before the spinner is read.
    await rerender(frameAt('silent-demo'));

    await expect.element(loading()).toBeInTheDocument();
  });
});
