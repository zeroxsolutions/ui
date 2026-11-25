import { frameData } from 'motion/react';
import { createRef, type ComponentType, type ReactNode, type Ref, type RefObject } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp } from 'vitest/browser';
import { usePlayWhile, type AnimatedIconHandle } from '@/registry/bases/base-ui/hooks/use-animated-icon';

type AnimatedIcon = ComponentType<{ ref?: Ref<AnimatedIconHandle> }>;

// Next's global types declare `import.meta.glob` without Vite's module type parameter, and theirs is
// the declaration that wins, so the module shape is asserted here instead.
const ICONS = import.meta.glob('./*-icon.tsx', { eager: true }) as Record<string, Record<string, AnimatedIcon>>;

const cases = Object.entries(ICONS).map(([path, module]) => {
  const name = path.slice('./'.length, -'.tsx'.length);
  const exported = Object.entries(module).find(([key]) => key.endsWith('Icon'));
  if (exported === undefined) throw new Error(`${path} exports no <Name>Icon`);
  return { name, Icon: exported[1] };
});

/** Longer than any icon's one play, delays included; the icons that loop are stopped once Motion's clock passes it. */
const PLAY_WINDOW_MS = 2000;

/** Longer than the play window and the return to rest, so the suite fails on a fault rather than on its length. */
const PLAY_TIMEOUT_MS = 20_000;

/**
 * Whether Motion's frame loop has stopped: no frame ran across two of the browser's. A start made while
 * the loop still runs draws its first frame in another order, which hides a value drawn before it is set.
 */
async function isMotionIdle(): Promise<boolean> {
  const before = frameData.timestamp;
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  return frameData.timestamp === before;
}

/** Resolves once `condition` holds, read again on every poll until `PLAY_TIMEOUT_MS` passes. */
async function until(condition: () => Promise<boolean>, what: string): Promise<void> {
  await vi.waitFor(
    async () => {
      if (!(await condition())) throw new Error(`Motion is still drawing: ${what}`);
    },
    { timeout: PLAY_TIMEOUT_MS },
  );
}

/** A control the reader has just acted on: it starts the icon on its first draw, as a highlighted menu row does. */
function ActedOn({ Icon, handle }: { Icon: AnimatedIcon; handle: RefObject<AnimatedIconHandle | null> }): ReactNode {
  usePlayWhile(handle, true, { playOnFirstDraw: true });
  return (
    <button type="button">
      <Icon ref={handle} />
    </button>
  );
}

/**
 * Every icon is drawn and started in the same render, so each starts from an idle frame loop, as one
 * started alone does; started one after another instead, the suite takes minutes.
 * Each attribute written as `undefined` is filed under the icon whose slot holds it.
 */
describe('animated icons in a browser', () => {
  const unset = new Map<string, string[]>(cases.map(({ name }) => [name, []]));
  const warnings: string[] = [];

  beforeAll(async () => {
    // The suite runs as a reader who asked for reduced motion, under which the icons start nothing.
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    await until(isMotionIdle, 'a frame loop from before the suite');
    for (const method of ['warn', 'error'] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        warnings.push(args.map(String).join(' '));
      });
    }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const element = record.target as Element;
        const value = element.getAttribute(record.attributeName ?? '');
        if (!value?.includes('undefined')) continue;
        const slot = element.closest('[data-slot]')?.getAttribute('data-slot') ?? '';
        unset.get(slot)?.push(`<${element.tagName.toLowerCase()}> ${record.attributeName}=${value}`);
      }
    });
    observer.observe(document.body, { subtree: true, attributes: true });

    const handles = cases.map(() => createRef<AnimatedIconHandle>());
    const startedAt = performance.now();
    const { unmount } = await render(
      <>
        {cases.map(({ name, Icon }, index) => (
          <ActedOn key={name} Icon={Icon} handle={handles[index]} />
        ))}
      </>,
    );
    await until(
      async () => (await isMotionIdle()) || frameData.timestamp - startedAt >= PLAY_WINDOW_MS,
      'the icons playing',
    );
    for (const handle of handles) handle.current?.stopAnimation();
    await until(isMotionIdle, 'the icons returning to rest');
    observer.disconnect();
    await unmount();
    vi.restoreAllMocks();
  }, PLAY_TIMEOUT_MS * 3);

  afterAll(async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  });

  it('plays the set without a warning or an error in the console', () => {
    expect(warnings).toEqual([]);
  });

  it.each(cases)('$name plays from its first draw without drawing a value it has not set', ({ name }) => {
    expect(unset.get(name)).toEqual([]);
  });
});
