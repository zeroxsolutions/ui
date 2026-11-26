import { icons as lucideIcons } from 'lucide-react';
import { frameData } from 'motion/react';
import { createRef, type ComponentType, type ReactNode, type Ref, type RefObject } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, userEvent } from 'vitest/browser';

import { drawingIn, playMotion } from '../../../../../test/motion';
import { centreOf, mouse } from '../../../../../test/pointer';
import { drawingsOver } from '../../../../../src/test/drawings-over';
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

/**
 * The icons that draw an element of their Lucide glyph in a form the walk cannot match by its attributes, so it does
 * not fail them for that element. Every other icon must draw each glyph element as Lucide spells it.
 */
const DRAWN_OTHERWISE = new Set<string>([
  // Split into pieces that move apart, whose union is the glyph element.
  'accessibility',
  'arrow-down-left',
  'brain',
  'clock',
  'folder-clock',
  'link-2',
  'rotate-ccw-clock',
  'ticket',
  // The glyph element's geometry drawn the other way, so a pathLength draw runs as the motion was made.
  'chart-line',
  'check',
  'check-check',
  'circle-check',
  'corner-down-left',
  'dollar-sign',
  'euro',
  'file-chart-line',
  'georgian-lari',
  'message-circle-check',
  'party-popper',
  'receipt-text',
  'trending-up-down',
  // A d that Motion morphs, written with its arc flags apart: Motion reads Lucide's packed `016` as one number.
  'face-grinning',
  'face-slightly-frowning',
  'face-slightly-smiling',
  // Drawn longer and clipped to the glyph's own outline, so a looping slide meets itself without a seam.
  'construction',
]);

/** One element of a Lucide glyph: its tag and the attributes that place it. */
type GlyphElement = [tag: string, attributes: Record<string, string>];

/** The attributes lucide-react sets on every glyph element's svg, which place nothing. */
const PRESENTATION = new Set([
  'class',
  'xmlns',
  'width',
  'height',
  'viewBox',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'aria-hidden',
]);

/** The elements of the Lucide glyph named `glyph`, read off the svg lucide-react draws for it. */
function glyphElements(container: Element, glyph: string): GlyphElement[] {
  const svg = container.querySelector(`[data-glyph="${glyph}"] svg`);
  if (svg === null) throw new Error(`lucide-react draws no ${glyph}`);
  return [...svg.children].map((element) => [
    element.tagName.toLowerCase(),
    Object.fromEntries(
      [...element.attributes].filter(({ name }) => !PRESENTATION.has(name)).map(({ name, value }) => [name, value]),
    ),
  ]);
}

/** lucide-react's component for `glyph`, named in PascalCase in its `icons` map. */
function lucideIcon(glyph: string): ComponentType {
  const name = glyph.replace(/(^|-)([a-z0-9])/g, (_, __, letter: string) => letter.toUpperCase());
  const Icon = (lucideIcons as Record<string, ComponentType>)[name];
  if (Icon === undefined) throw new Error(`lucide-react has no ${name}`);
  return Icon;
}

/** Whether `element` is the glyph element `tag` placed by `attributes`. */
function draws(element: Element, tag: string, attributes: Record<string, string>): boolean {
  return (
    element.tagName.toLowerCase() === tag &&
    Object.entries(attributes).every(([attribute, value]) => element.getAttribute(attribute) === value)
  );
}

/**
 * Whether `element` is drawn whole inside `svg`: at full opacity, its own and every group's around it, and with
 * all of its length drawn. Motion writes a pathLength as `stroke-dasharray` over a `pathLength` of 1, its first
 * value the share drawn, and a pathOffset as `stroke-dashoffset`.
 */
function isWhole(element: Element, svg: Element): boolean {
  for (let node: Element | null = element; node !== null && node !== svg.parentElement; node = node.parentElement) {
    const opacity = (node as SVGElement).style?.opacity || node.getAttribute('opacity');
    if (opacity !== null && opacity !== '' && Number(opacity) < 1) return false;
    if (!isIdentity((node as SVGElement).style?.transform) || !isIdentity(node.getAttribute('transform'))) return false;
  }
  const drawn = element.getAttribute('stroke-dasharray');
  const offset = element.getAttribute('stroke-dashoffset');
  return (drawn === null || Number.parseFloat(drawn) >= 1) && (offset === null || Number.parseFloat(offset) === 0);
}

/** Whether a CSS or SVG transform leaves the element where it is: no translation or turn, and a scale of 1. */
function isIdentity(transform: string | null | undefined): boolean {
  if (transform === null || transform === undefined || transform === '' || transform === 'none') return true;
  return [...transform.matchAll(/(\w+)\(([^)]*)\)/g)].every(([, kind, values]) => {
    const numbers = values
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((value) => Number.parseFloat(value));
    if (kind.startsWith('scale')) return numbers.every((value) => value === 1);
    if (kind === 'matrix') return numbers.join(' ') === '1 0 0 1 0 0';
    return numbers.every((value) => value === 0);
  });
}

function IconRow({ handles }: { handles?: RefObject<AnimatedIconHandle | null>[] }): ReactNode {
  return (
    <>
      {cases.map(({ name, Icon }, index) => (
        <button key={name} type="button" data-icon={name}>
          <Icon ref={handles?.[index]} />
        </button>
      ))}
    </>
  );
}

/** Whether `read` answers other than `rest` on some frame before `ms` pass; it stops reading at the first change. */
async function changes(read: () => string, rest: string, ms: number): Promise<boolean> {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    if (read() !== rest) return true;
    await new Promise(requestAnimationFrame);
  }
  return false;
}

/** Moves the browser's own mouse onto `element`, scrolled into view first; quicker than a locator's hover. */
async function pointAt(element: Element): Promise<void> {
  element.scrollIntoView({ block: 'center' });
  await mouse('move', centreOf(element));
}

/** The button holding the icon `name`. */
const buttonOf = (name: string): Element => document.querySelector(`[data-icon="${name}"]`) as Element;

/**
 * Every icon is drawn and started at once, then read on every frame for 1.5 s: an icon whose motion starts only after
 * a delay is still caught. An icon counts as played when its drawing on some frame differs from its rest drawing. At
 * rest, read after the icons are stopped, each element of the icon's Lucide glyph must be drawn whole by some element
 * of the icon: at full opacity, fully drawn, and neither moved, turned nor scaled, itself or through a group around
 * it. A glyph element no element draws fails the icon unless the icon is in DRAWN_OTHERWISE. A decoration outside the
 * glyph is not checked.
 */
describe('the walk', () => {
  playMotion();

  const WINDOW_MS = 1500;
  const played = new Set<string>();
  const unwhole = new Map<string, string[]>();

  beforeAll(async () => {
    const handles = cases.map(() => createRef<AnimatedIconHandle>());
    const { container, unmount } = await render(
      <>
        {cases.map(({ name, Icon }, index) => {
          const glyph = name.slice(0, -'-icon'.length);
          const Glyph = lucideIcon(glyph);
          return (
            <div key={name}>
              <span data-glyph={glyph}>
                <Glyph />
              </span>
              <button type="button" data-icon={name}>
                <Icon ref={handles[index]} />
              </button>
            </div>
          );
        })}
      </>,
    );
    await until(isMotionIdle, 'the icons drawing their first frame');
    // Rest is read after the icons are stopped, so Motion has written each rest value it would write on a start;
    // read before it, a start that only writes rest values would count as a move.
    for (const handle of handles) handle.current?.stopAnimation();
    await until(isMotionIdle, 'the icons coming to rest');
    for (const { name } of cases) {
      const glyph = name.slice(0, -'-icon'.length);
      const svg = buttonOf(name).querySelector('svg') as Element;
      const drawn = [...svg.querySelectorAll('*')];
      const isDrawn = ([tag, attributes]: GlyphElement): boolean =>
        drawn.some((element) => draws(element, tag, attributes));
      const isDrawnWhole = ([tag, attributes]: GlyphElement): boolean =>
        drawn.some((element) => draws(element, tag, attributes) && isWhole(element, svg));
      unwhole.set(
        name,
        glyphElements(container, glyph)
          .filter((element) => isDrawn(element) || !DRAWN_OTHERWISE.has(glyph))
          .filter((element) => !isDrawnWhole(element))
          .map(
            (element) =>
              `${isDrawn(element) ? 'not whole at rest' : 'not drawn'}: ${element[0]} ${JSON.stringify(element[1])}`,
          ),
      );
    }
    const buttons = cases.map(({ name }) => buttonOf(name));
    const rest = buttons.map(drawingIn);
    for (const handle of handles) handle.current?.startAnimation();
    await drawingsOver(() => {
      buttons.forEach((button, index) => {
        if (drawingIn(button) !== rest[index]) played.add(cases[index].name);
      });
      return '';
    }, WINDOW_MS);
    for (const handle of handles) handle.current?.stopAnimation();
    await until(isMotionIdle, 'the icons returning to rest');
    await unmount();
  }, PLAY_TIMEOUT_MS * 3);

  it.each(cases)('$name plays from its handle', ({ name }) => {
    expect(played.has(name)).toBe(true);
  });

  it.each(cases)('$name draws its whole Lucide glyph at rest', ({ name }) => {
    expect(unwhole.get(name)).toEqual([]);
  });
});

describe('hovering an icon', () => {
  playMotion();

  const played = new Map<string, boolean>();

  beforeAll(async () => {
    await userEvent.unhover(document.body);
    await render(<IconRow />);
    await until(isMotionIdle, 'the icons drawing their first frame');
    for (const { name } of cases) {
      const button = buttonOf(name);
      const rest = drawingIn(button);
      await pointAt(button.firstElementChild as Element);
      played.set(name, await changes(() => drawingIn(button), rest, 600));
    }
    await userEvent.unhover(document.body);
  }, cases.length * 2000);

  it.each(cases)('$name plays on hover', ({ name }) => {
    expect(played.get(name)).toBe(true);
  });
});

// The browser project runs as a reader who asked for reduced motion.
describe('under reduced motion', () => {
  const fromHandle = new Map<string, Set<string>>();
  const onHover = new Map<string, Set<string>>();

  beforeAll(async () => {
    await userEvent.unhover(document.body);
    const handles = cases.map(() => createRef<AnimatedIconHandle>());
    await render(
      <>
        <IconRow handles={handles} />
        <IconRow />
      </>,
    );
    await until(isMotionIdle, 'the icons drawing their first frame');
    const buttons = [...document.querySelectorAll('[data-icon]')];
    const controlled = buttons.slice(0, cases.length);
    const hovered = buttons.slice(cases.length);
    // A stop and a pointer that leaves each write the icon's rest values, which its first draw may not have written;
    // the rest drawing is read after both, so a case compares like with like.
    for (const handle of handles) handle.current?.stopAnimation();
    for (const button of hovered) await pointAt(button.firstElementChild as Element);
    await userEvent.unhover(document.body);
    await until(isMotionIdle, 'the icons coming to rest');
    const rest = buttons.map(drawingIn);
    for (const [index, button] of hovered.entries()) {
      await pointAt(button.firstElementChild as Element);
      onHover.set(cases[index].name, new Set([rest[index + cases.length], drawingIn(button)]));
    }
    for (const handle of handles) handle.current?.startAnimation();
    const frames = [...(await drawingsOver(() => JSON.stringify(controlled.map(drawingIn)), 600))].map(
      (frame) => JSON.parse(frame) as string[],
    );
    for (const [index, { name }] of cases.entries()) {
      fromHandle.set(name, new Set([rest[index], ...frames.map((frame) => frame[index])]));
    }
  }, PLAY_TIMEOUT_MS * 6);

  it.each(cases)('$name keeps its rest drawing on hover and from its handle', ({ name }) => {
    expect([onHover.get(name)?.size, fromHandle.get(name)?.size]).toEqual([1, 1]);
  });
});
