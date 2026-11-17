import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';
import type { IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';

import {
  ICON_GALLERY_PICK_MESSAGE,
  ICON_GALLERY_QUERY_MESSAGE,
  ICON_GALLERY_READY_MESSAGE,
} from '../../lib/native-icon-gallery';

import { NativeIconGallery } from './native-icon-gallery';

const SETS: IconSet[] = [
  {
    set: 'lucide',
    icons: [
      { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
      { name: 'lucide-copy-icon', glyph: 'copy' },
    ],
  },
];

function renderGallery(search = ''): void {
  render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TestHost pathname="/native/icons/nativewind" search={search}>
        <NativeIconGallery engine="nativewind" sets={SETS} />
      </TestHost>
    </ThemeProvider>,
  );
}

const frame = (): HTMLIFrameElement => screen.getByTitle('Icon gallery demo preview');

/** The messages the page has posted into the frame, with the origin each was posted to. */
function postedToFrame(): ReturnType<typeof vi.fn> {
  const contentWindow = frame().contentWindow;
  if (!contentWindow) throw new Error('the frame has no window');
  return vi.spyOn(contentWindow, 'postMessage') as unknown as ReturnType<typeof vi.fn>;
}

/** A message as the gallery demo in the frame posts it to the page. */
function postFromFrame(data: unknown, source: MessageEventSource | null = frame().contentWindow): void {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source, origin: window.location.origin }));
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('NativeIconGallery', () => {
  it("frames the engine's gallery demo", async () => {
    renderGallery('?style=nova');

    await waitFor(() =>
      expect(frame().getAttribute('src')).toBe(
        '/native-preview/index.html?style=nova&demo=icon-gallery-demo&theme=light',
      ),
    );
  });

  it('sends the search it holds once the frame says it is ready, and each search typed after', async () => {
    renderGallery('?q=arrow');
    const posted = postedToFrame();

    postFromFrame({ type: ICON_GALLERY_READY_MESSAGE });

    expect(posted).toHaveBeenLastCalledWith(
      { type: ICON_GALLERY_QUERY_MESSAGE, query: 'arrow' },
      window.location.origin,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), { target: { value: 'copy' } });

    await waitFor(() =>
      expect(posted).toHaveBeenLastCalledWith(
        { type: ICON_GALLERY_QUERY_MESSAGE, query: 'copy' },
        window.location.origin,
      ),
    );
  });

  it('sends nothing to a frame that has not said it is ready, and takes no message from another window', () => {
    renderGallery();
    const posted = postedToFrame();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), { target: { value: 'copy' } });
    postFromFrame({ type: ICON_GALLERY_READY_MESSAGE }, window);

    expect(posted).not.toHaveBeenCalled();
  });

  it('shows the install line and the native usage of the icon tapped in the frame, and hands the frame the pick', () => {
    renderGallery();
    const posted = postedToFrame();
    postFromFrame({ type: ICON_GALLERY_READY_MESSAGE });

    postFromFrame({ type: ICON_GALLERY_PICK_MESSAGE, name: 'lucide-arrow-up-icon' });

    const panel = screen.getByRole('region', { name: 'arrow-up' });
    expect(panel.textContent).toContain('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
    expect(panel.textContent).toContain('<Icon as={ArrowUpIcon} ref={icon} />');
    expect(panel.textContent).not.toContain('pointed at');
    expect(posted).toHaveBeenLastCalledWith(
      { type: ICON_GALLERY_QUERY_MESSAGE, query: '', picked: 'lucide-arrow-up-icon' },
      window.location.origin,
    );
  });
});
