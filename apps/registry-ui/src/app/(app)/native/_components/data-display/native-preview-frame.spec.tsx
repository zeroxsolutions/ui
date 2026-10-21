import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NATIVE_PREVIEW_HEIGHT_MESSAGE } from '@/lib/native-preview';

import { NativePreviewFrame } from './native-preview-frame';

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
  vi.useRealTimers();
});

function renderFrame(theme: 'light' | 'dark' = 'light'): void {
  render(
    <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
      <NativePreviewFrame demo="button-demo" />
    </ThemeProvider>,
  );
}

function frame(): HTMLIFrameElement {
  return screen.getByTitle('Button demo preview');
}

/** A message as the preview page in the frame posts it to the site. */
function postFromFrame(data: unknown, source: MessageEventSource | null = frame().contentWindow): void {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source, origin: window.location.origin }));
  });
}

describe('NativePreviewFrame', () => {
  it("frames the demo in the page's style and the site's mode", () => {
    url.search = '?style=nova';

    renderFrame('dark');

    expect(frame().getAttribute('src')).toBe('/native-preview/nova/button-demo.html?theme=dark');
  });

  it('frames the default style in light where the page names no style and the site is light', () => {
    renderFrame();

    expect(frame().getAttribute('src')).toBe('/native-preview/vega/button-demo.html?theme=light');
  });

  it('shows it is loading until the preview posts its height, then takes that height', () => {
    renderFrame();
    expect(screen.getByRole('status', { name: 'Loading the preview' })).toBeTruthy();
    // Covered by the spinner, the frame is out of the tab order and hidden from assistive technology.
    expect(frame().hasAttribute('inert')).toBe(true);

    postFromFrame({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 148 });

    expect(screen.queryByRole('status', { name: 'Loading the preview' })).toBeNull();
    expect(frame().hasAttribute('inert')).toBe(false);
    expect(frame().closest('[data-slot=native-preview-frame]')?.getAttribute('style')).toContain(
      '--native-preview-height: 148px',
    );
  });

  it('takes no height from a message another window posts', () => {
    renderFrame();

    postFromFrame({ type: NATIVE_PREVIEW_HEIGHT_MESSAGE, height: 148 }, window);

    expect(screen.getByRole('status', { name: 'Loading the preview' })).toBeTruthy();
  });

  it('says the preview did not load when it never posts its height, with a link to open it alone', () => {
    vi.useFakeTimers();
    renderFrame();

    act(() => vi.advanceTimersByTime(20_000));

    expect(screen.getByRole('alert').textContent).toContain('The preview did not load');
    expect(screen.getByRole('link', { name: /open it/i }).getAttribute('href')).toBe(
      '/native-preview/vega/button-demo.html?theme=light',
    );
  });

  it('says the preview did not load as soon as the frame holds a page from elsewhere, such as an error page', () => {
    renderFrame();
    Object.defineProperty(frame(), 'contentDocument', { value: null });

    fireEvent.load(frame());

    expect(screen.getByRole('alert').textContent).toContain('The preview did not load');
  });

  it('says the preview did not load as soon as the frame holds a page with no preview in it, such as a 404', () => {
    renderFrame();
    const missing = document.implementation.createHTMLDocument('Not found');
    Object.defineProperty(frame(), 'contentDocument', { value: missing });

    fireEvent.load(frame());

    expect(screen.getByRole('alert').textContent).toContain('The preview did not load');
  });

  it('keeps waiting for the height once a page holding the preview has loaded', () => {
    renderFrame();
    const preview = document.implementation.createHTMLDocument('Preview');
    preview.body.innerHTML = '<div id="root"></div>';
    Object.defineProperty(frame(), 'contentDocument', { value: preview });

    fireEvent.load(frame());

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status', { name: 'Loading the preview' })).toBeTruthy();
  });
});
