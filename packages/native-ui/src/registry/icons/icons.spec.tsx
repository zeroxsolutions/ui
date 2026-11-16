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
 * those handed to an animated component count, so a part computed and never drawn changes nothing. `props` holds
 * the animated props alone, which reach the native view without passing through react-native-svg's components.
 */
const mockDrawn: { current: unknown[]; props: unknown[] }[] = [];

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
      const entry = useRef<{ current: unknown[]; props: unknown[] } | null>(null);
      if (entry.current === null) {
        entry.current = { current: [], props: [] };
        mockDrawn.push(entry.current);
      }
      entry.current.current = [props.animatedProps, props.style].flat(Infinity).filter((value) => value != null);
      entry.current.props = [props.animatedProps].flat(Infinity).filter((value) => value != null);
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

/** How long every icon's motion may run, out and back, in ms. */
const MOTION_LIMIT = 600;

/** How often the walker looks at a moving icon, in ms. */
const SAMPLE = 25;

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

/** The animated values each animated part is drawn with now, one entry per part. */
const parts = (): string[] =>
  mockDrawn.map((part) =>
    JSON.stringify(
      part.current.map((value) =>
        typeof value === 'object' && value !== null ? (mockUpdaters.get(value)?.current() ?? value) : value,
      ),
    ),
  );

/**
 * The transform props react-native-svg folds into `matrix` only when React renders a shape. An animated update
 * skips that render, and the native view, which declares `matrix` alone, ignores them.
 */
const RENDER_ONLY_TRANSFORM = [
  'translate',
  'translateX',
  'translateY',
  'scale',
  'scaleX',
  'scaleY',
  'rotation',
  'origin',
  'originX',
  'originY',
  'skew',
  'skewX',
  'skewY',
  'transform',
];

/** The animated props each animated part is drawn with now, all parts together. */
const animatedProps = (): Record<string, unknown>[] =>
  mockDrawn.flatMap((part) =>
    part.props.flatMap((value) => {
      const props = typeof value === 'object' && value !== null ? (mockUpdaters.get(value)?.current() ?? value) : value;
      return typeof props === 'object' && props !== null ? [props as Record<string, unknown>] : [];
    }),
  );

/** The drawing as it stands now: the rendered tree, and the animated values its parts are drawn with. */
const drawing = (): string => JSON.stringify({ tree: screen.toJSON(), animated: parts() });

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

    it('moves each of its animated parts when started', async () => {
      reduceMotion(false);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);
      const resting = parts();
      const moved = new Set<number>();

      await act(() => handle.current?.startAnimation());
      for (let elapsed = 0; elapsed < MOTION_LIMIT; elapsed += SAMPLE) {
        await elapse(SAMPLE);
        parts().forEach((part, index) => {
          if (part !== resting[index]) moved.add(index);
        });
      }
      expect(resting.length).toBeGreaterThan(0);
      expect(resting.map((_part, index) => index).filter((index) => !moved.has(index))).toEqual([]);
    });

    it('moves its parts only through props the native view reads', async () => {
      reduceMotion(false);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);

      await act(() => handle.current?.startAnimation());
      await elapse(MID_MOTION);
      const names = animatedProps().flatMap((props) => Object.keys(props));
      expect(names.filter((name) => RENDER_ONLY_TRANSFORM.includes(name))).toEqual([]);
    });

    it("rests untransformed, since react-native-svg drops a path's matrix from its first render", async () => {
      reduceMotion(false);
      await renderIcon(Glyph, createRef());

      const matrices = animatedProps().flatMap((props) => ('matrix' in props ? [props.matrix] : []));
      expect(matrices.filter((matrix) => JSON.stringify(matrix) !== '[1,0,0,1,0,0]')).toEqual([]);
    });

    it(`is back at rest within ${MOTION_LIMIT} ms of being started`, async () => {
      reduceMotion(false);
      const handle = createRef<IconHandle>();
      await renderIcon(Glyph, handle);
      const resting = drawing();

      await act(() => handle.current?.startAnimation());
      await elapse(MID_MOTION);
      expect(drawing()).not.toBe(resting);
      await elapse(MOTION_LIMIT - MID_MOTION);
      expect(drawing()).toBe(resting);
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
