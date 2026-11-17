import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle, type ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArrowUpIcon } from '../../../../registry/bases/base-ui/icons/lucide/arrow-up-icon';
import type { IconSet } from '../../lib/icon-sets';
import { RegistryExamplesProvider } from './registry-example';

import { IconGrid } from './icon-grid';

// The reader of this run has asked for reduced motion; Motion's own hook reads it through `matchMedia`.
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => true,
}));

// jsdom has no IntersectionObserver, and nothing in it scrolls; every tile here is near the viewport.
class NearIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as never);
  }
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', NearIntersectionObserver);
});

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

const handles = new Map<string, { startAnimation: () => void; stopAnimation: () => void }>();

/** An icon that hands the grid a handle recording its calls, under `name`. */
function recordingIcon(name: string): ComponentType {
  const handle = { startAnimation: vi.fn(), stopAnimation: vi.fn() };
  handles.set(name, handle);
  return forwardRef(function RecordingIcon(_props, ref) {
    useImperativeHandle(ref, () => handle);
    return <svg data-testid={name} />;
  }) as unknown as ComponentType;
}

function renderGrid(query: string, components?: Record<string, ComponentType>, onPick = vi.fn()) {
  const icons = components ?? Object.fromEntries(SETS[0].icons.map(({ name }) => [name, recordingIcon(name)] as const));
  render(
    <RegistryExamplesProvider components={icons}>
      <IconGrid sets={SETS} query={query} onPick={onPick} />
    </RegistryExamplesProvider>,
  );
  return onPick;
}

afterEach(() => {
  cleanup();
  handles.clear();
  vi.unstubAllGlobals();
});

describe('IconGrid', () => {
  it('heads each set with its name and shows the icons whose name holds the query', async () => {
    renderGrid('Arrow Up');

    expect(screen.getByRole('heading', { name: 'lucide' })).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'arrow-up' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'arrow-up-right' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'arrow-down' })).toBeNull();
  });

  it("starts a tile's icon on pointer enter and on focus, and stops it on leave and on blur", async () => {
    renderGrid('');
    const tile = await screen.findByRole('button', { name: 'arrow-up' });
    const handle = handles.get('lucide-arrow-up-icon');

    fireEvent.mouseEnter(tile);
    expect(handle?.startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.mouseLeave(tile);
    expect(handle?.stopAnimation).toHaveBeenCalledTimes(1);
    fireEvent.focus(tile);
    expect(handle?.startAnimation).toHaveBeenCalledTimes(2);
    fireEvent.blur(tile);
    expect(handle?.stopAnimation).toHaveBeenCalledTimes(2);
    expect(handles.get('lucide-arrow-down-icon')?.startAnimation).not.toHaveBeenCalled();
  });

  it('draws no icon of a tile until it comes near the viewport', async () => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    renderGrid('arrow-up');

    expect(await screen.findByRole('button', { name: 'arrow-up' })).toBeTruthy();
    expect(screen.queryByTestId('lucide-arrow-up-icon')).toBeNull();
  });

  it('hands the picked tile its item name', async () => {
    const onPick = renderGrid('');

    fireEvent.click(await screen.findByRole('button', { name: 'arrow-up-right' }));

    expect(onPick).toHaveBeenCalledWith('lucide-arrow-up-right-icon');
  });

  it("leaves the icon's drawing as it was when the reader asked for reduced motion", async () => {
    const icon = ArrowUpIcon as unknown as ComponentType;
    renderGrid('arrow-up', { 'lucide-arrow-up-icon': icon, 'lucide-arrow-up-right-icon': icon });
    const tile = await screen.findByRole('button', { name: 'arrow-up' });
    const drawing = (): string => tile.querySelector('svg')?.outerHTML ?? '';
    const before = drawing();

    fireEvent.mouseEnter(tile);
    fireEvent.focus(tile);
    await act(() => new Promise((resolve) => setTimeout(resolve, 500)));

    expect(before).not.toBe('');
    expect(drawing()).toBe(before);
  });
});
