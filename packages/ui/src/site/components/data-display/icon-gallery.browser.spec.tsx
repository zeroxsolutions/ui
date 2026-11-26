import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { TestHost } from '../../../test/test-host';
import type { IconSet } from '../../lib/icon-sets';

import { IconGallery } from './icon-gallery';

const SETS: IconSet[] = [
  {
    set: 'lucide',
    icons: [
      { name: 'lucide-arrow-down-icon', glyph: 'arrow-down' },
      { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
      { name: 'lucide-arrow-up-right-icon', glyph: 'arrow-up-right' },
    ],
  },
];

interface GridProps {
  query: string;
  onPick: (name: string) => void;
}

/** A grid drawing one pick button for each icon whose glyph holds the query it is handed. */
function Grid({ query, onPick }: GridProps): ReactNode {
  return (
    <div>
      {SETS[0].icons
        .filter(({ glyph }) => glyph.includes(query.trim().toLowerCase().replace(/\s+/g, '-')))
        .map(({ name, glyph }) => (
          <button key={name} type="button" onClick={() => onPick(name)}>
            {glyph}
          </button>
        ))}
    </div>
  );
}

/** The path and query of the entry the page's history now holds. */
const here = (): string => `${window.location.pathname}${window.location.search}`;

const start = here();

function gallery({
  search = '',
  sets = SETS,
  onPick,
  usage,
}: {
  search?: string;
  sets?: IconSet[];
  onPick?: () => void;
  usage?: (set: string, glyph: string) => string;
} = {}): ReactNode {
  return (
    <TestHost pathname="/icons/base" search={search}>
      <IconGallery sets={sets} renderGrid={(props) => <Grid {...props} />} onPick={onPick} usage={usage} />
    </TestHost>
  );
}

const box = () => page.getByRole('searchbox', { name: 'Search icons' });
const status = () => page.getByRole('status');

afterEach(() => {
  window.history.replaceState(null, '', start);
});

describe('IconGallery', () => {
  it('sits in a search landmark, and narrows the icons as the reader types, the URL taking the text at a pause', async () => {
    await render(gallery());
    await expect.element(page.getByRole('search', { name: 'Icons' }).getByRole('searchbox')).toBeVisible();
    await expect.element(status()).toHaveTextContent('3 icons');
    const entries = window.history.length;

    await userEvent.fill(box(), 'Arrow Up');

    await expect.element(status()).toHaveTextContent('2 icons');
    await expect.element(page.getByRole('button', { name: 'arrow-down' })).not.toBeInTheDocument();
    await expect.poll(here).toBe('/icons/base?q=Arrow+Up');
    expect(window.history.length).toBe(entries);
  });

  it("opens on the URL's search, and a submit adds a history entry keeping the page's style", async () => {
    await render(gallery({ search: 'q=up&style=vega' }));
    await expect.element(box()).toHaveValue('up');
    await expect.element(status()).toHaveTextContent('2 icons');
    const entries = window.history.length;

    await userEvent.fill(box(), 'down');
    await userEvent.keyboard('{Enter}');

    await expect.poll(here).toBe('/icons/base?q=down&style=vega');
    expect(window.history.length).toBe(entries + 1);
  });

  it("keeps the reader's text when the host reads back an older search the box wrote, and follows one it did not", async () => {
    const { rerender } = await render(gallery());
    await userEvent.fill(box(), 'up');
    await expect.poll(here).toBe('/icons/base?q=up');
    await userEvent.fill(box(), 'down');
    await expect.poll(here).toBe('/icons/base?q=down');

    await rerender(gallery({ search: 'q=up' }));
    await expect.element(box()).toHaveValue('down');
    await rerender(gallery({ search: 'q=down' }));
    await expect.element(box()).toHaveValue('down');

    await rerender(gallery({ search: 'q=arrow' }));
    await expect.element(box()).toHaveValue('arrow');
  });

  it('says so when no icon has a name holding the query', async () => {
    await render(gallery());

    await userEvent.fill(box(), 'zebra');

    await expect.element(status()).toHaveTextContent('No icon has a name holding "zebra".');
  });

  it('says so when there is no icon to search', async () => {
    await render(gallery({ sets: [] }));

    await expect.element(status()).toHaveTextContent('No icons are published yet.');
  });

  it('marks the picked icon, moves focus to its install line, and copies the line its copy button holds', async () => {
    const onPick = vi.fn();
    await render(gallery({ onPick }));

    await userEvent.click(page.getByRole('button', { name: 'arrow-up', exact: true }));

    expect(onPick).toHaveBeenCalledWith('lucide-arrow-up-icon');
    const panel = page.getByRole('region', { name: 'arrow-up' });
    await expect.element(panel.getByRole('heading', { name: 'arrow-up' })).toHaveFocus();
    await expect.element(panel).toHaveTextContent('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
    await expect
      .element(panel)
      .toHaveTextContent(
        "import { ArrowUpIcon, type ArrowUpIconHandle } from '@/components/general/lucide/arrow-up-icon';",
      );

    await userEvent.click(panel.getByRole('button', { name: 'Copy the install line' }));

    await expect
      .poll(() => navigator.clipboard.readText())
      .toBe('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
  });

  it('shows the usage snippet the page hands it for the picked icon', async () => {
    await render(gallery({ usage: (set, glyph) => `usage of ${set}/${glyph}` }));

    await userEvent.click(page.getByRole('button', { name: 'arrow-up', exact: true }));

    await expect.element(page.getByRole('region', { name: 'arrow-up' })).toHaveTextContent('usage of lucide/arrow-up');
  });
});
