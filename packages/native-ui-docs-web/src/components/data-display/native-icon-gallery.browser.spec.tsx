import { ThemeProvider } from 'next-themes';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import type { IconSet } from '@zeroxsolutions/ui/site/lib/icon-sets';
import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { ICON_GALLERY_DEMO, iconGalleryQueryMessage } from '../../lib/native-icon-gallery';
import { nativePreviewTitle } from '../../lib/native-preview';

import { NativeIconGallery } from './native-icon-gallery';

// The browser project serves src/test/public: its gallery demo says it is ready, lists each message the page sends
// it under "Received", and posts a pick of lucide-arrow-up-icon when its arrow-up button is pressed.

const SETS: IconSet[] = [
  {
    set: 'lucide',
    icons: [
      { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
      { name: 'lucide-copy-icon', glyph: 'copy' },
    ],
  },
];

async function renderGallery(search = ''): Promise<void> {
  await render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TestHost pathname="/native/icons/nativewind" search={search}>
        <NativeIconGallery engine="nativewind" sets={SETS} />
      </TestHost>
    </ThemeProvider>,
  );
}

const demo = () => page.frameLocator(page.getByTitle(nativePreviewTitle(ICON_GALLERY_DEMO)));
const received = () => demo().getByRole('list', { name: 'Received' });

describe('NativeIconGallery', () => {
  it('sends the frame the search it holds once the frame says it is ready, and each search typed after', async () => {
    await renderGallery('?q=arrow');

    await expect.element(received()).toHaveTextContent(JSON.stringify(iconGalleryQueryMessage('arrow')));

    await userEvent.fill(page.getByRole('searchbox', { name: 'Search icons' }), 'copy');

    await expect.element(received()).toHaveTextContent(JSON.stringify(iconGalleryQueryMessage('copy')));
  });

  it('shows the install line and the native usage of the icon tapped in the frame, and hands the frame the pick', async () => {
    await renderGallery();

    await userEvent.click(demo().getByRole('button', { name: 'arrow-up' }));

    const panel = page.getByRole('region', { name: 'arrow-up' });
    await expect.element(panel).toHaveTextContent('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
    await expect.element(panel).toHaveTextContent('<Icon as={ArrowUpIcon} ref={icon} />');
    await expect
      .element(received())
      .toHaveTextContent(JSON.stringify(iconGalleryQueryMessage('', 'lucide-arrow-up-icon')));
  });
});
