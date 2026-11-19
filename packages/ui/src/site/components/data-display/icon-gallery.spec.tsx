import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
  picked?: string;
  onPick: (name: string) => void;
}

/** A grid drawing one pick button per icon it is handed, recording what it was drawn for. */
const renderGrid = vi.fn(({ query, onPick }: GridProps): ReactNode => (
  <div data-query={query}>
    {SETS[0].icons.map(({ name, glyph }) => (
      <button key={name} type="button" onClick={() => onPick(name)}>
        {glyph}
      </button>
    ))}
  </div>
));

/** The path and query of the entry the page's history now holds. */
const here = (): string => `${window.location.pathname}${window.location.search}`;

function renderGallery({
  search = '',
  sets = SETS,
  onPick,
  usage,
}: {
  search?: string;
  sets?: IconSet[];
  onPick?: () => void;
  usage?: (set: string, glyph: string) => string;
} = {}) {
  render(
    <TestHost pathname="/icons/base" search={search}>
      <IconGallery sets={sets} renderGrid={renderGrid} onPick={onPick} usage={usage} />
    </TestHost>,
  );
}

const box = () => screen.getByRole('searchbox', { name: 'Search icons' }) as HTMLInputElement;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('IconGallery', () => {
  it('sits in a search landmark, and narrows the icons as the reader types, the URL taking the text at a pause', async () => {
    renderGallery();
    expect(within(screen.getByRole('search', { name: 'Icons' })).getByRole('searchbox')).toBe(box());
    expect(screen.getByRole('status').textContent).toBe('3 icons');

    fireEvent.change(box(), { target: { value: 'Arrow Up' } });

    await waitFor(() => expect(renderGrid).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'Arrow Up' })));
    expect(screen.getByRole('status').textContent).toBe('2 icons');
    const entries = window.history.length;
    await waitFor(() => expect(here()).toBe('/icons/base?q=Arrow+Up'));
    expect(window.history.length).toBe(entries);
  });

  it("opens on the URL's search, and a submit adds a history entry keeping the page's style", () => {
    renderGallery({ search: 'q=up&style=vega' });
    expect(box().value).toBe('up');
    expect(renderGrid).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'up' }));
    expect(screen.getByRole('status').textContent).toBe('2 icons');

    const entries = window.history.length;
    fireEvent.change(box(), { target: { value: 'down' } });
    fireEvent.submit(box().form as HTMLFormElement);

    expect(here()).toBe('/icons/base?q=down&style=vega');
    expect(window.history.length).toBe(entries + 1);
  });

  it("keeps the reader's text when the host reads back an older search the box wrote, and follows one it did not", async () => {
    const page = (search: string) => (
      <TestHost pathname="/icons/base" search={search}>
        <IconGallery sets={SETS} renderGrid={renderGrid} />
      </TestHost>
    );
    const { rerender } = render(page(''));
    fireEvent.change(box(), { target: { value: 'up' } });
    await waitFor(() => expect(here()).toBe('/icons/base?q=up'));
    fireEvent.change(box(), { target: { value: 'down' } });
    await waitFor(() => expect(here()).toBe('/icons/base?q=down'));

    rerender(page('q=up'));
    expect(box().value).toBe('down');
    rerender(page('q=down'));
    expect(box().value).toBe('down');

    rerender(page('q=arrow'));
    expect(box().value).toBe('arrow');
  });

  it('says so when no icon has a name holding the query', () => {
    renderGallery();

    fireEvent.change(box(), { target: { value: 'zebra' } });

    expect(screen.getByRole('status').textContent).toBe('No icon has a name holding "zebra".');
  });

  it('says so when there is no icon to search', () => {
    renderGallery({ sets: [] });

    expect(screen.getByRole('status').textContent).toBe('No icons are published yet.');
  });

  it('marks the picked icon, moves focus to its install line, and copies the line its copy button holds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onPick = vi.fn();
    renderGallery({ onPick });

    fireEvent.click(screen.getByRole('button', { name: 'arrow-up' }));

    expect(onPick).toHaveBeenCalledWith('lucide-arrow-up-icon');
    expect(renderGrid).toHaveBeenLastCalledWith(expect.objectContaining({ picked: 'lucide-arrow-up-icon' }));
    const panel = screen.getByRole('region', { name: 'arrow-up' });
    await waitFor(() => expect(document.activeElement).toBe(within(panel).getByRole('heading', { name: 'arrow-up' })));
    expect(panel.textContent).toContain('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon');
    fireEvent.click(within(panel).getByRole('button', { name: 'Copy the install line' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon'));
    expect(panel.textContent).toContain("import { useRef } from 'react';");
    expect(panel.textContent).toContain(
      "import { ArrowUpIcon, type ArrowUpIconHandle } from '@/components/general/lucide/arrow-up-icon';",
    );
  });

  it('shows the usage snippet the page hands it for the picked icon', () => {
    renderGallery({ usage: (set, glyph) => `usage of ${set}/${glyph}` });

    fireEvent.click(screen.getByRole('button', { name: 'arrow-up' }));

    expect(screen.getByRole('region', { name: 'arrow-up' }).textContent).toContain('usage of lucide/arrow-up');
  });
});
