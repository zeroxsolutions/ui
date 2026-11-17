import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, createRef, forwardRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion's hooks are replaced by recording stand-ins: jsdom runs no animation frame, so a case asserts
 * which controls an icon started, not a value it never animates. `motion.<tag>` renders the bare tag
 * with Motion's own props removed. The walk sets `real`, and then Motion runs as shipped, its elements
 * marked `data-walk` where they carry variants that set a value or an `animate` target, so the walk can
 * find what an icon moves. An element handed only the controls, or variants holding nothing but a
 * transition, is a group passing its variant on to its children; it moves nothing of its own and goes
 * unmarked.
 */
const motionState = vi.hoisted(() => ({ reduced: false, real: false, starts: [] as unknown[][] }));

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  const MOTION_PROPS = new Set([
    'animate',
    'initial',
    'variants',
    'transition',
    'custom',
    'exit',
    'whileHover',
    'whileTap',
  ]);
  // One component per tag, so a render does not remount what an earlier render drew.
  const standIns = new Map<string, ComponentType>();
  const standIn = (tag: string) =>
    forwardRef<Element, Record<string, unknown>>(function MotionStandIn(props, ref) {
      if (motionState.real) {
        const walked = setsValues(props.variants) || isTarget(props.animate);
        const Real = (actual.motion as unknown as Record<string, ComponentType<Record<string, unknown>>>)[tag];
        return createElement(Real, { ...props, ...(walked ? { 'data-walk': '' } : {}), ref });
      }
      const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
      return createElement(tag, { ...rest, ref });
    }) as unknown as ComponentType;
  const setsValues = (variants: unknown) =>
    typeof variants === 'object' &&
    variants !== null &&
    Object.values(variants).some(
      (variant) =>
        typeof variant === 'function' ||
        Object.keys(variant as object).some((key) => key !== 'transition' && key !== 'transitionEnd'),
    );
  const isTarget = (animate: unknown) => typeof animate === 'object' && animate !== null && !('start' in animate);
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) => {
        if (!standIns.has(tag)) standIns.set(tag, standIn(tag));
        return standIns.get(tag);
      },
    },
  );
  return {
    ...actual,
    motion,
    useAnimation: () =>
      motionState.real
        ? actual.useAnimation()
        : {
            start: (...args: unknown[]) => {
              motionState.starts.push(args);
              return Promise.resolve();
            },
            stop: () => undefined,
            set: () => undefined,
            mount: () => () => undefined,
          },
    useReducedMotion: () => motionState.reduced,
  };
});

interface Handle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

type AnimatedIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean; ref?: Ref<Handle> }>;

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
// the declaration that wins, so the module shape is asserted here instead.
const ICONS = import.meta.glob('./*-icon.tsx', { eager: true }) as Record<string, Record<string, AnimatedIcon>>;

const cases = Object.entries(ICONS).map(([path, module]) => {
  const name = path.slice('./'.length, -'.tsx'.length);
  const exported = Object.entries(module).find(([key]) => key.endsWith('Icon'));
  if (exported === undefined) throw new Error(`${path} exports no <Name>Icon`);
  return { name, Icon: exported[1] };
});

function inButton(node: ReactNode) {
  return render(<button type="button">{node}</button>);
}

/** The starts that play something, leaving out the resets an icon makes on leave. */
function playStarts(): unknown[][] {
  return motionState.starts.filter(([variant]) => !['normal', 'initial'].includes(String(variant)));
}

beforeEach(() => {
  motionState.reduced = false;
  motionState.starts = [];
});

afterEach(cleanup);

describe('animated icons', () => {
  it('finds the icons of its set', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  describe.each(cases)('$name', ({ name, Icon }) => {
    it('renders a span wrapper carrying its slot, the caller className and aria-hidden', () => {
      const { container } = inButton(<Icon className="size-4" aria-hidden />);
      const wrapper = container.querySelector(`[data-slot="${name}"]`);
      expect(wrapper?.tagName).toBe('SPAN');
      expect(wrapper?.className).toContain('inline-flex');
      expect(wrapper?.className).toContain('size-4');
      expect(wrapper?.getAttribute('aria-hidden')).toBe('true');
    });

    it('plays on hover when motion is not reduced', () => {
      const { container } = inButton(<Icon />);
      fireEvent.mouseEnter(container.querySelector(`[data-slot="${name}"]`)!);
      expect(playStarts().length).toBeGreaterThan(0);
    });

    it('starts nothing on hover under reduced motion', () => {
      motionState.reduced = true;
      const { container } = inButton(<Icon />);
      fireEvent.mouseEnter(container.querySelector(`[data-slot="${name}"]`)!);
      expect(playStarts()).toEqual([]);
    });

    it('plays from its handle when motion is not reduced', () => {
      const ref = createRef<Handle>();
      inButton(<Icon ref={ref} />);
      ref.current?.startAnimation();
      expect(playStarts().length).toBeGreaterThan(0);
    });

    it('starts nothing from its handle under reduced motion', () => {
      motionState.reduced = true;
      const ref = createRef<Handle>();
      inButton(<Icon ref={ref} />);
      ref.current?.startAnimation();
      expect(playStarts()).toEqual([]);
    });
  });

  /**
   * Every icon is drawn and started at once, then read every 40 ms for 1.5 s: an element that moves
   * only after a delay, as file-text's last line does at 0.7 s, is still caught, where one read at a
   * fixed time would miss it. An element counts as moved when any attribute, style included, differs
   * from what it read at rest.
   */
  describe('the walk', () => {
    const SAMPLE_MS = 40;
    const WINDOW_MS = 1500;
    const REST_MS = 600;
    // Every icon is drawn and read on each sample, so the walk's time grows with the set and its limit grows with it.
    const WALK_TIMEOUT_MS = 10_000 + cases.length * 500;
    const unmoved = new Map<string, string[]>();
    let stillIcons: string[] = [];

    beforeAll(async () => {
      motionState.real = true;
      motionState.reduced = false;
      const handles = cases.map(() => createRef<Handle>());
      const { container } = render(
        <>
          {cases.map(({ name, Icon }, index) => (
            <button key={name} type="button" data-icon={name}>
              <Icon ref={handles[index]} />
            </button>
          ))}
        </>,
      );
      // Rest is read after the icons are stopped, so Motion has written each rest value it would write on
      // a start; read before it, a start that only writes rest values would count as a move.
      for (const handle of handles) handle.current?.stopAnimation();
      await wait(REST_MS);
      const walked = cases.map(({ name }) => {
        const elements = [...container.querySelectorAll(`[data-icon="${name}"] [data-walk]`)];
        return { name, elements, rest: elements.map(attributesOf), moved: elements.map(() => false) };
      });
      for (const handle of handles) handle.current?.startAnimation();
      for (let elapsed = 0; elapsed < WINDOW_MS; elapsed += SAMPLE_MS) {
        await wait(SAMPLE_MS);
        for (const icon of walked) {
          icon.elements.forEach((element, index) => {
            if (attributesOf(element) !== icon.rest[index]) icon.moved[index] = true;
          });
        }
      }
      for (const icon of walked) {
        unmoved.set(
          icon.name,
          icon.elements.filter((_, index) => !icon.moved[index]).map((element) => element.outerHTML),
        );
      }
      stillIcons = walked.filter((icon) => icon.elements.length === 0).map((icon) => icon.name);
      cleanup();
      motionState.real = false;
    }, WALK_TIMEOUT_MS);

    it('finds an animated element in every icon', () => {
      expect(stillIcons).toEqual([]);
    });

    it.each(cases)('$name moves every animated element', ({ name }) => {
      expect(unmoved.get(name)).toEqual([]);
    });
  });
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** An element's attributes, style included, as one comparable string. */
function attributesOf(element: Element): string {
  return [...element.attributes].map((attribute) => `${attribute.name}=${attribute.value}`).join(' ');
}
