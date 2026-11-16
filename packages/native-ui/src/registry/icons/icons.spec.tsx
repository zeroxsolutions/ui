import { act, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { readdirSync } from 'node:fs';
import { createRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { AnimatedIconProps, IconHandle } from '../lib/icon-motion';
import type { LucideProps } from 'lucide-react-native';
import { Icon } from '../ui/icon';

const HIDDEN = { includeHiddenElements: true } as const;

/**
 * The animated props and styles each animated part of the icon under test is drawn with, read through their
 * updaters: Reanimated's Jest setup keeps animated values off the host elements Testing Library renders. Only
 * those handed to an animated component count, so a part computed and never drawn changes nothing.
 */
const mockDrawn: { current: unknown[] }[] = [];

/** The updater behind each object `useAnimatedProps` or `useAnimatedStyle` returned, as of its last render. */
const mockUpdaters = new WeakMap<object, { current: () => unknown }>();

/** The props of an animated part the walker reads its animated values from. */
interface DrawnProps {
  animatedProps?: unknown;
  style?: unknown;
}

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated');
  const { createElement, useRef } = jest.requireActual<typeof import('react')>('react');
  const recorded =
    (hook: (...args: never[]) => unknown) =>
    (updater: () => unknown, ...rest: unknown[]) => {
      const animated = (hook as (...args: unknown[]) => object)(updater, ...rest);
      const slot = mockUpdaters.get(animated) ?? { current: updater };
      slot.current = updater;
      mockUpdaters.set(animated, slot);
      return animated;
    };
  const createAnimatedComponent = (component: never): unknown => {
    const Animated = actual.createAnimatedComponent(component) as unknown as ComponentType<DrawnProps>;
    return function Drawn(props: DrawnProps) {
      const entry = useRef<{ current: unknown[] } | null>(null);
      if (entry.current === null) {
        entry.current = { current: [] };
        mockDrawn.push(entry.current);
      }
      entry.current.current = [props.animatedProps, props.style].flat(Infinity).filter((value) => value != null);
      return createElement(Animated, props);
    };
  };
  return {
    ...actual,
    __esModule: true,
    default: { ...actual.default, createAnimatedComponent },
    createAnimatedComponent,
    useAnimatedProps: recorded(actual.useAnimatedProps),
    useAnimatedStyle: recorded(actual.useAnimatedStyle),
  };
});

/** A time well inside every icon's motion, in ms, when its parts have left their resting place. */
const MID_MOTION = 100;

/** `copy-icon` as its export is named, `CopyIcon`. */
const exportName = (name: string): string =>
  name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

/** Every animated icon in this folder, by its registry name, with the component its file exports. */
const icons: [string, ComponentType<AnimatedIconProps>][] = readdirSync(__dirname)
  .filter((file) => file.endsWith('-icon.tsx'))
  .map((file) => {
    const name = file.replace(/\.tsx$/, '');
    const exports = require(`./${name}`) as Record<string, ComponentType<AnimatedIconProps>>;
    return [name, exports[exportName(name)]];
  });

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

/** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

/** Draws `Glyph` through Icon, handing its handle to `handle`. */
async function renderIcon(Glyph: ComponentType<AnimatedIconProps>, handle: Ref<IconHandle>): Promise<void> {
  function Bound(props: LucideProps): ReactNode {
    return <Glyph {...props} ref={handle} />;
  }
  await render(<Icon as={Bound} testID="icon" className="size-4" />);
  await elapse(0);
}

/** The drawing as it stands now: the rendered tree, and the animated values its parts are drawn with. */
const drawing = (): string =>
  JSON.stringify({
    tree: screen.toJSON(),
    animated: mockDrawn.map((part) =>
      part.current.map((value) =>
        typeof value === 'object' && value !== null ? (mockUpdaters.get(value)?.current() ?? value) : value,
      ),
    ),
  });

beforeEach(() => {
  jest.useFakeTimers();
  mockDrawn.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('the animated icons', () => {
  it('finds the icons in this folder, each exporting its component under its own name', () => {
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.filter(([, Glyph]) => typeof Glyph !== 'function').map(([name]) => name)).toEqual([]);
  });

  describe.each(icons)('%s', (_name, Glyph) => {
    it('draws inside Icon, hidden from a screen reader', async () => {
      reduceMotion(false);
      await renderIcon(Glyph, createRef());

      expect(isHiddenFromAccessibility(screen.getByTestId('icon', HIDDEN))).toBe(true);
    });

    it('moves its parts when started', async () => {
      reduceMotion(false);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);
      const resting = drawing();

      await act(() => handle.current?.startAnimation());
      await elapse(MID_MOTION);
      expect(drawing()).not.toBe(resting);
    });

    it('stays still when started under reduced motion', async () => {
      reduceMotion(true);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);
      const resting = drawing();

      await act(() => handle.current?.startAnimation());
      await elapse(MID_MOTION);
      expect(drawing()).toBe(resting);
    });

    it('comes back to rest at once when stopped', async () => {
      reduceMotion(false);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);
      const resting = drawing();

      await act(() => handle.current?.startAnimation());
      await elapse(MID_MOTION);
      await act(() => handle.current?.stopAnimation());
      expect(drawing()).toBe(resting);
    });
  });
});
