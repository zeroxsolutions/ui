import type { ReactNode } from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { cdp, page } from 'vitest/browser';

import { PLATFORM_STYLES } from '../src/site/constants/platform-styles';
import { applyStyleClass } from '../src/site/lib/style-class';
import { VISUAL_THEMES, VISUAL_VIEWPORT } from './visual-environment';

declare module 'vitest' {
  export interface ProvidedContext {
    /** The style the running browser instance draws every capture in. */
    visualStyle: (typeof PLATFORM_STYLES)['web'][number];
    /** The theme the running browser instance draws every capture in. */
    visualTheme: (typeof VISUAL_THEMES)[number];
  }
}

/** The width a desktop reader's page is drawn at. */
export const DESKTOP = 1280;
/** The width a phone reader's page is drawn at. */
export const MOBILE = 375;

/** One surface the suite captures in every style and theme, one browser instance per pair. */
export interface VisualSubject {
  /** Names the reference file, so it stays unique within its spec file. */
  name: string;
  render(): ReactNode;
  /** The widths it is captured at; `DESKTOP` alone unless its layout changes with width. */
  widths?: readonly number[];
  /**
   * Brings it to the state the capture shows, through the browser's own input, once it has rendered; answers
   * the element to capture, else the stage is captured.
   */
  arrange?(stage: HTMLElement): Promise<HTMLElement | undefined | void>;
  /**
   * Draws the stage at the window's size, for a surface whose popups portal out of it: a capture is a clip of the
   * page, so the popups over the stage are in it.
   */
  window?: boolean;
}

/** How long the page has to come to rest once its images, fonts and code are in, well inside the test's own timeout. */
const SETTLE_DEADLINE = 20_000;

/**
 * Resolves once every image on the page has loaded, every font it uses is in, every animation with an end has
 * ended, and a frame has painted. Rejects, naming what kept moving, when the page is still moving at
 * `SETTLE_DEADLINE`, or as soon as `signal` reports the case has ended.
 */
async function settled(signal: AbortSignal): Promise<void> {
  await vi.waitFor(
    () => {
      const loading = [...document.images].filter((image) => !image.complete);
      if (loading.length > 0) throw new Error(`${loading.length} images still loading`);
    },
    // An emoji picker loads a picture per emoji, which outlasts the one-second default.
    { timeout: 30_000 },
  );
  // Highlighted code shows its raw source until the grammar loads, then its coloured tokens.
  await vi.waitFor(
    () => {
      const plain = [...document.querySelectorAll('[data-slot=highlighted-code]')].filter(
        (code) => code.querySelector('span[style]') === null,
      );
      if (plain.length > 0) throw new Error(`${plain.length} code blocks not yet highlighted`);
    },
    { timeout: 30_000 },
  );
  // A Mermaid diagram draws an empty canvas until its render resolves.
  await vi.waitFor(
    () => {
      const drawing = document.querySelectorAll(
        '[data-slot=diagram-canvas]:is([data-status=idle], [data-status=rendering])',
      );
      if (drawing.length > 0) throw new Error(`${drawing.length} diagrams not yet drawn`);
    },
    { timeout: 30_000 },
  );
  await document.fonts.ready;
  const deadline = performance.now() + SETTLE_DEADLINE;
  // What the page does once an animation ends, such as a drawer moving focus to its first control, can start another.
  for (let finished = finishAnimations(); finished.length > 0; finished = finishAnimations()) {
    if (performance.now() > deadline) {
      throw new Error(`the page kept animating for ${SETTLE_DEADLINE}ms: ${finished.join(', ')}`);
    }
    await quiet(deadline, signal);
  }
  await quiet(deadline, signal);
}

/**
 * Plays every running animation that has an end, such as a drawer's slide in, to its end at once; answers what
 * each one animated. The capture's own `animations: 'disabled'` does the same, but only as it takes each shot, so
 * what the page did once one ended changed the next shot, and a capture taken under load could come out differently.
 */
function finishAnimations(): string[] {
  const running = document
    .getAnimations()
    .filter(
      (animation) => animation.playState === 'running' && animation.effect?.getComputedTiming().endTime !== Infinity,
    );
  for (const animation of running) animation.finish();
  return running.map(describeAnimation);
}

function describeAnimation(animation: Animation): string {
  const what =
    animation instanceof CSSTransition
      ? `transition of ${animation.transitionProperty}`
      : animation instanceof CSSAnimation
        ? `animation ${animation.animationName}`
        : 'script animation';
  const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
  return `${what} on ${target === null ? 'nothing' : describeNode(target)}`;
}

function describeNode(node: Node): string {
  if (!(node instanceof Element)) return node.nodeName;
  const slot = node.getAttribute('data-slot');
  return slot === null ? node.tagName.toLowerCase() : `[data-slot=${slot}]`;
}

/**
 * Resolves once the page has gone five frames without a change to its DOM, so a part laid out after its
 * content arrives, such as a diagram fitted to its frame, has settled before the capture. Rejects with the last
 * changes it saw once `deadline`, a `performance.now()` reading, has passed, or when `signal` aborts.
 */
function quiet(deadline: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let still = 0;
    let changes: string[] = [];
    const observer = new MutationObserver((records) => {
      still = 0;
      changes = records.map(
        (record) =>
          `${record.type}${record.attributeName === null ? '' : ` ${record.attributeName}`} on ${describeNode(record.target)}`,
      );
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    const frame = (): void => {
      if (signal.aborted) {
        observer.disconnect();
        reject(signal.reason);
        return;
      }
      if (performance.now() > deadline) {
        observer.disconnect();
        reject(new Error(`the page kept changing for ${SETTLE_DEADLINE}ms: ${[...new Set(changes)].join(', ')}`));
        return;
      }
      still += 1;
      if (still >= 5) {
        observer.disconnect();
        resolve();
      } else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

/**
 * Makes `Math.random` answer one fixed sequence from here on (mulberry32), so a part placed at random, such as
 * the animated grid's lit cells or the highlighter's strokes, lands in the same place on every run.
 */
function seedRandom(): void {
  let state = 0x9e3779b9;
  Math.random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The attributes `element` carries, by name. */
function attributesOf(element: Element): Map<string, string> {
  return new Map([...element.attributes].map((attribute) => [attribute.name, attribute.value]));
}

/** Gives `element` back exactly the attributes in `attributes`, such as a scroll lock's inline style taken off. */
function restoreAttributes(element: Element, attributes: Map<string, string>): void {
  for (const { name } of [...element.attributes]) if (!attributes.has(name)) element.removeAttribute(name);
  for (const [name, value] of attributes) if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** The page as a spec file finds it, before its first case draws anything. */
interface PristinePage {
  html: Map<string, string>;
  body: Map<string, string>;
  bodyChildren: ReadonlySet<Node>;
}

function recordPage(): PristinePage {
  return {
    html: attributesOf(document.documentElement),
    body: attributesOf(document.body),
    bodyChildren: new Set(document.body.childNodes),
  };
}

/**
 * Brings the page back to `pristine` before a case draws: what the last case rendered is unmounted, and what it
 * left behind outside its own tree is removed, such as a popup's portal, a modal's scroll lock and `inert` marks
 * on `<html>` and `<body>`, the focus, a text selection, the scroll and the pointer resting over a control. Each
 * of those changed how the next case drew, so a capture matched its reference in one order of cases and not in another.
 */
async function restorePage(pristine: PristinePage): Promise<void> {
  await cleanup();
  for (const child of [...document.body.childNodes]) if (!pristine.bodyChildren.has(child)) child.remove();
  restoreAttributes(document.documentElement, pristine.html);
  restoreAttributes(document.body, pristine.body);
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  document.getSelection()?.removeAllRanges();
  window.scrollTo(0, 0);
  // The stage's top-left corner is its padding, over no control, so the pointer hovers nothing the capture shows.
  await mouseTo({ x: 0, y: 0 });
}

/** Moves the mouse, with no button held, to `point` in the spec's viewport, through the browser's own input. */
async function mouseTo({ x, y }: { x: number; y: number }): Promise<void> {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame && window.innerWidth > 0 ? frame.width / window.innerWidth : 1;
  await cdp().send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: (frame?.left ?? 0) + x * scale,
    y: (frame?.top ?? 0) + y * scale,
    button: 'none',
    buttons: 0,
  });
}

async function capture(subject: VisualSubject, width: number, signal: AbortSignal): Promise<void> {
  seedRandom();
  const style = inject('visualStyle');
  const theme = inject('visualTheme');
  await page.viewport(width, VISUAL_VIEWPORT.height);
  // The classes the page's style script and the theme provider put on `<html>`.
  const root = document.documentElement;
  applyStyleClass(root, 'web', style);
  root.classList.toggle('dark', theme === 'dark');

  const screen = await render(
    <div
      data-visual-stage=""
      className="bg-background text-foreground p-6"
      // The window's height exactly: a taller page would scroll under the capture and move the popups with it.
      style={subject.window ? { height: VISUAL_VIEWPORT.height, overflow: 'hidden' } : undefined}
    >
      {subject.render()}
    </div>,
  );
  const stage = screen.container.querySelector<HTMLElement>('[data-visual-stage]');
  if (stage === null) throw new Error('the stage did not render');
  await settled(signal);
  const target = (await subject.arrange?.(stage)) ?? stage;
  await settled(signal);
  // A case that timed out is not cancelled; left to run on, it would capture the next case's page under its own name.
  signal.throwIfAborted();

  // A locator, not the element: given an element, `expect.element` retries a failed comparison until the test's own
  // timeout, and each retry overwrites the actual and diff images, the last one after the page has moved on.
  await expect.element(page.elementLocator(target)).toMatchScreenshot(`${subject.name}-${style}-${theme}-${width}`);
}

/**
 * One case per subject at each of its widths, captured in the running instance's style and theme and named
 * after all four, so a failure says which one drew differently. The widths run in turn, so the window is resized
 * once per width rather than once per case. Each case starts from the page as the spec file found it.
 */
export function describeVisual(title: string, subjects: readonly VisualSubject[]): void {
  describe(title, () => {
    let pristine: PristinePage;
    beforeAll(() => {
      pristine = recordPage();
    });
    beforeEach(() => restorePage(pristine));
    afterAll(() => restorePage(pristine));

    const widths = [...new Set(subjects.flatMap((subject) => subject.widths ?? [DESKTOP]))];
    const cases = widths.flatMap((width) =>
      subjects
        .filter((subject) => (subject.widths ?? [DESKTOP]).includes(width))
        .map((subject) => ({ subject, width })),
    );
    it.for(cases)('$subject.name at $width', ({ subject, width }, { signal }) => capture(subject, width, signal));
  });
}
