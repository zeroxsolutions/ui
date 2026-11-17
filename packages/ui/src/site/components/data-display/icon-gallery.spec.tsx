import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

/** A grid drawing one pick button per icon it is handed, recording the query it was drawn for. */
const renderGrid = vi.fn(({ query, onPick }: { query: string; onPick: (name: string) => void }): ReactNode => (
  <div data-query={query}>
    {SETS[0].icons.map(({ name, glyph }) => (
      <button key={name} type="button" onClick={() => onPick(name)}>
        {glyph}
      </button>
    ))}
  </div>
));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('IconGallery', () => {
  it('hands the grid what the reader types and says how many icons have a name holding it', async () => {
    render(<IconGallery sets={SETS} renderGrid={renderGrid} />);
    expect(screen.getByRole('status').textContent).toBe('3 icons');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), { target: { value: 'Arrow Up' } });

    await waitFor(() => expect(renderGrid).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'Arrow Up' })));
    expect(screen.getByRole('status').textContent).toBe('2 icons');
  });

  it('says so when no icon has a name holding the query', () => {
    render(<IconGallery sets={SETS} renderGrid={renderGrid} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search icons' }), { target: { value: 'zebra' } });

    expect(screen.getByRole('status').textContent).toBe('No icon has a name holding "zebra".');
  });

  it('shows the picked icon its install line, which its copy button copies, and a usage snippet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const onPick = vi.fn();
    render(<IconGallery sets={SETS} renderGrid={renderGrid} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'arrow-up' }));

    expect(onPick).toHaveBeenCalledWith('lucide-arrow-up-icon');
    const panel = screen.getByRole('region', { name: 'arrow-up' });
    expect(within(panel).getByText('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon')).toBeTruthy();
    fireEvent.click(within(panel).getByRole('button', { name: 'Copy the install line' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('pnpm dlx shadcn@latest add @zui/lucide-arrow-up-icon'));
    const usage = within(panel).getByText(/@\/components\/general\/lucide\/arrow-up-icon/);
    expect(usage.textContent).toContain(
      "import { ArrowUpIcon, type ArrowUpIconHandle } from '@/components/general/lucide/arrow-up-icon';",
    );
  });
});
