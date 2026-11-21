import { forwardRef, useImperativeHandle, type ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { ArrowUpIcon } from '../../../../registry/bases/base-ui/icons/lucide/arrow-up-icon';
import { drawingsOver } from '../../../test/drawings-over';
import type { IconSet } from '../../lib/icon-sets';
import { RegistryExamplesProvider } from './registry-example';

import { IconGrid } from './icon-grid';

const ARROWS: IconSet = {
  set: 'lucide',
  icons: [
    { name: 'lucide-arrow-down-icon', glyph: 'arrow-down' },
    { name: 'lucide-arrow-up-icon', glyph: 'arrow-up' },
    { name: 'lucide-arrow-up-right-icon', glyph: 'arrow-up-right' },
  ],
};

const handles = new Map<string, { startAnimation: () => void; stopAnimation: () => void }>();

/** An icon that hands its tile a handle recording the calls, under `name`, and draws a mark named for it. */
function recordingIcon(name: string): ComponentType {
  const handle = { startAnimation: vi.fn(), stopAnimation: vi.fn() };
  handles.set(name, handle);
  return forwardRef<unknown>(function RecordingIcon(_props, ref) {
    useImperativeHandle(ref, () => handle);
    return <svg data-testid={name} width={24} height={24} />;
  }) as unknown as ComponentType;
}

function recordingIcons(sets: IconSet[]): Record<string, ComponentType> {
  return Object.fromEntries(sets.flatMap(({ icons }) => icons.map(({ name }) => [name, recordingIcon(name)] as const)));
}

async function renderGrid({
  sets = [ARROWS],
  query = '',
  picked,
  components = recordingIcons(sets),
  onPick = vi.fn(),
}: {
  sets?: IconSet[];
  query?: string;
  picked?: string;
  components?: Record<string, ComponentType>;
  onPick?: (name: string) => void;
} = {}) {
  await render(
    <RegistryExamplesProvider components={components}>
      <IconGrid sets={sets} query={query} picked={picked} onPick={onPick} />
    </RegistryExamplesProvider>,
  );
  return onPick;
}

afterEach(() => {
  handles.clear();
});

describe('IconGrid', () => {
  it('heads each set with its name and shows the icons whose name holds the query, the picked one current', async () => {
    await renderGrid({ query: 'Arrow Up', picked: 'lucide-arrow-up-icon' });

    await expect.element(page.getByRole('heading', { name: 'lucide' })).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'arrow-up', exact: true }))
      .toHaveAttribute('aria-current', 'true');
    await expect.element(page.getByRole('button', { name: 'arrow-up-right' })).not.toHaveAttribute('aria-current');
    await expect.element(page.getByRole('button', { name: 'arrow-up-right' })).not.toHaveAttribute('aria-pressed');
    await expect.element(page.getByRole('button', { name: 'arrow-down' })).not.toBeInTheDocument();
  });

  it("starts a tile's icon as the pointer enters it and as it takes focus, and stops it as either leaves", async () => {
    // The pointer rests where an earlier spec left it. A tile mounting under it takes the pointer's enter before
    // its icon is drawn, so the icon would never see the hover below as a change.
    await userEvent.unhover(document.body);
    await renderGrid({ query: 'arrow-up' });
    const tile = page.getByRole('button', { name: 'arrow-up', exact: true });
    await expect.element(page.getByTestId('lucide-arrow-up-icon')).toBeInTheDocument();
    const handle = handles.get('lucide-arrow-up-icon');

    // The tile plays its icon from an effect after the state the event set, so each count is waited for.
    const calls = (fn: (() => void) | undefined) => () =>
      (fn as ReturnType<typeof vi.fn> | undefined)?.mock.calls.length;
    await userEvent.hover(tile);
    await expect.poll(calls(handle?.startAnimation)).toBe(1);
    await userEvent.unhover(tile);
    await expect.poll(calls(handle?.stopAnimation)).toBe(1);

    await userEvent.tab();
    await expect.element(tile).toHaveFocus();
    await expect.poll(calls(handle?.startAnimation)).toBe(2);
    await userEvent.tab();
    await expect.poll(calls(handle?.stopAnimation)).toBe(2);
    await expect.poll(calls(handles.get('lucide-arrow-up-right-icon')?.startAnimation)).toBe(1);
  });

  it('hands the picked tile its item name', async () => {
    const onPick = await renderGrid();

    await userEvent.click(page.getByRole('button', { name: 'arrow-up-right' }));

    expect(onPick).toHaveBeenCalledWith('lucide-arrow-up-right-icon');
  });

  it("draws a tile's icon only once the tile comes near the viewport", async () => {
    const many: IconSet = {
      set: 'lucide',
      icons: Array.from({ length: 150 }, (_, i) => ({
        name: `icon-${i}`,
        glyph: `glyph-${String(i).padStart(3, '0')}`,
      })),
    };
    await renderGrid({ sets: [many] });
    await expect.element(page.getByTestId('icon-0')).toBeInTheDocument();
    const last = page.getByRole('button', { name: 'glyph-149' });
    await expect.element(last).toBeInTheDocument();
    expect(page.getByTestId('icon-149').query()).toBeNull();

    last.element().scrollIntoView();

    await expect.element(page.getByTestId('icon-149')).toBeInTheDocument();
  });

  // The browser project runs as a reader who asked for reduced motion. The real icons load Motion's own
  // modules for the first time in the run, which a shared runner takes seconds over.
  it("leaves the icon's drawing as it was under reduced motion", async () => {
    const icon = ArrowUpIcon as unknown as ComponentType;
    await renderGrid({
      components: { 'lucide-arrow-up-icon': icon, 'lucide-arrow-up-right-icon': icon, 'lucide-arrow-down-icon': icon },
    });
    const tile = page.getByRole('button', { name: 'arrow-up', exact: true });
    await expect.poll(() => tile.element().querySelector('svg')).not.toBeNull();
    const drawing = (): string => tile.element().querySelector('svg')?.outerHTML ?? '';
    const before = drawing();

    await userEvent.hover(tile);
    const drawings = await drawingsOver(drawing, 500);

    expect(drawings).toEqual(new Set([before]));
  }, 20_000);
});
