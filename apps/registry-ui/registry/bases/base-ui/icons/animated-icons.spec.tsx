import { cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, createRef, forwardRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Motion's hooks are replaced by recording stand-ins: jsdom runs no animation frame, so a case asserts
 * which controls an icon started, not a value it never animates. `motion.<tag>` renders the bare tag
 * with Motion's own props removed.
 */
const motionState = vi.hoisted(() => ({ reduced: false, starts: [] as unknown[][] }));

vi.mock('motion/react', () => {
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
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        forwardRef<Element, Record<string, unknown>>(function MotionStandIn(props, ref) {
          const rest = Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
          return createElement(tag, { ...rest, ref });
        }),
    },
  );
  return {
    motion,
    useAnimation: () => ({
      start: (...args: unknown[]) => {
        motionState.starts.push(args);
        return Promise.resolve();
      },
      stop: () => undefined,
      set: () => undefined,
      mount: () => () => undefined,
    }),
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
  it('covers all 37 icons', () => {
    expect(cases).toHaveLength(37);
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
});
