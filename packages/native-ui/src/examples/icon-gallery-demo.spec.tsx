import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { IconGalleryDemo } from './icon-gallery-demo';

/** The progress each stand-in icon's motion is at, by glyph, as of its last render. */
const mockProgress = new Map<string, SharedValue<number>>();

// Three stand-ins for the lucide folder, each moving through the real useIconMotion, so a spec reads how far
// the icon a tile holds has moved.
jest.mock('./lucide-icon-modules', () => {
  const { useIconMotion } = jest.requireActual<typeof import('@/lib/icon-motion')>('@/lib/icon-motion');
  const standIn = (glyph: string) =>
    function StandIn({ ref }: import('@/lib/icon-motion').AnimatedIconProps) {
      mockProgress.set(glyph, useIconMotion(ref));
      return null;
    };
  const modules: Record<string, Record<string, unknown>> = {
    './arrow-down-icon.tsx': { ArrowDownIcon: standIn('arrow-down') },
    './arrow-up-icon.tsx': { ArrowUpIcon: standIn('arrow-up') },
    './copy-icon.tsx': { CopyIcon: standIn('copy') },
  };
  const lucideIconModules = (key: string) => modules[key];
  lucideIconModules.keys = () => Object.keys(modules);
  return { lucideIconModules };
});

const ORIGIN = 'https://ui.zeroxsolutions.com';

/** The page framing the demo, as the demo's window sees it. */
const page = { postMessage: jest.fn() };

/** The demo's listener for the messages its window receives. */
let deliver: ((event: { data: unknown; origin: string; source: unknown }) => void) | undefined;

/** The demo's window, framed by {@link page} on {@link ORIGIN}, as the web export runs it. */
const framed = {
  parent: page,
  location: { origin: ORIGIN },
  addEventListener: (_type: string, listener: typeof deliver) => {
    deliver = listener;
  },
  removeEventListener: () => {
    deliver = undefined;
  },
};
/** The global the demo reads as its window, which React Native's own is. */
const window = globalThis as unknown as Record<string, unknown>;
/** The keys of {@link framed} the window held before the spec framed it, with what each held. */
const unframed = Object.fromEntries(Object.keys(framed).flatMap((key) => (key in window ? [[key, window[key]]] : [])));

/** Posts `data` to the demo from `source` on `origin`, as the page framing it does. */
const receive = (data: unknown, { origin = ORIGIN, source = page as unknown } = {}) =>
  act(() => deliver?.({ data, origin, source }));

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

/** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

const tile = (glyph: string) => screen.findByRole('button', { name: glyph });

beforeEach(() => {
  Object.assign(window, framed);
  page.postMessage.mockClear();
  mockProgress.clear();
  reduceMotion(false);
});

afterEach(() => {
  for (const key of Object.keys(framed)) {
    if (key in unframed) window[key] = unframed[key];
    else delete window[key];
  }
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('IconGalleryDemo', () => {
  it('tells the page framing it that it is ready, on the page origin', async () => {
    await render(<IconGalleryDemo />);

    expect(page.postMessage).toHaveBeenCalledWith({ type: 'zui:icon-gallery:ready' }, ORIGIN);
  });

  it("narrows the grid to the page's query, and ignores a query from any other origin or window", async () => {
    await render(<IconGalleryDemo />);
    expect(await tile('copy')).toBeOnTheScreen();

    await receive({ type: 'zui:icon-gallery:query', query: 'arrow' });

    expect(screen.getByRole('button', { name: 'arrow-up' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'arrow-down' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'copy' })).toBeNull();

    await receive({ type: 'zui:icon-gallery:query', query: 'copy' }, { origin: 'https://elsewhere.example' });
    await receive({ type: 'zui:icon-gallery:query', query: 'copy' }, { source: {} });

    expect(screen.queryByRole('button', { name: 'copy' })).toBeNull();
  });

  it('tells the page the item name of the icon tapped, and marks its tile', async () => {
    await render(<IconGalleryDemo />);

    await fireEvent.press(await tile('arrow-up'));

    expect(page.postMessage).toHaveBeenCalledWith(
      { type: 'zui:icon-gallery:pick', name: 'lucide-arrow-up-icon' },
      ORIGIN,
    );
    expect(screen.getByRole('button', { name: 'arrow-up' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'copy' })).not.toBeSelected();
  });

  it('marks the tile of the icon the page says was picked, as after the frame loads again', async () => {
    await render(<IconGalleryDemo />);
    await tile('copy');

    await receive({ type: 'zui:icon-gallery:query', query: '', picked: 'lucide-copy-icon' });

    expect(screen.getByRole('button', { name: 'copy' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'arrow-up' })).not.toBeSelected();
  });

  it('starts the icon of a tile on press-in and on focus, and lets press-out leave it playing', async () => {
    jest.useFakeTimers();
    await render(<IconGalleryDemo />);
    const control = await tile('arrow-up');
    await elapse(0);

    await act(() => fireEvent(control, 'pressIn', { nativeEvent: {} }));
    await elapse(100);
    await act(() => fireEvent(control, 'pressOut', { nativeEvent: {} }));
    await elapse(50);
    expect(mockProgress.get('arrow-up')?.value).toBeGreaterThan(0);
    expect(mockProgress.get('copy')?.value).toBe(0);

    await elapse(500);
    await act(() => control.props.onFocus({ nativeEvent: {} }));
    await elapse(100);
    expect(mockProgress.get('arrow-up')?.value).toBeGreaterThan(0);
  });

  it('moves no icon on press-in under reduced motion', async () => {
    reduceMotion(true);
    jest.useFakeTimers();
    await render(<IconGalleryDemo />);
    const control = await tile('arrow-up');
    await elapse(0);

    await act(() => fireEvent(control, 'pressIn', { nativeEvent: {} }));
    for (const ms of [50, 100, 200]) {
      await elapse(ms);
      expect(mockProgress.get('arrow-up')?.value).toBe(0);
    }
  });
});
