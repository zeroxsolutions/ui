import type { ReactNode } from 'react';
import { describe, expect, inject, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

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

/** Resolves once every image on the page has loaded, every font it uses is in, and a frame has painted. */
async function settled(): Promise<void> {
  await vi.waitFor(
    () => {
      const loading = [...document.images].filter((image) => !image.complete);
      if (loading.length > 0) throw new Error(`${loading.length} images still loading`);
    },
    // An emoji picker loads a picture per emoji, which outlasts the one-second default.
    { timeout: 30_000 },
  );
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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

async function capture(subject: VisualSubject, width: number): Promise<void> {
  seedRandom();
  const style = inject('visualStyle');
  const theme = inject('visualTheme');
  await page.viewport(width, VISUAL_VIEWPORT.height);
  // The classes the page's style script and the theme provider put on `<html>`.
  const root = document.documentElement;
  applyStyleClass(root, 'web', style);
  root.classList.toggle('dark', theme === 'dark');
  window.scrollTo(0, 0);

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
  await settled();
  const target = (await subject.arrange?.(stage)) ?? stage;
  await settled();

  await expect.element(target).toMatchScreenshot(`${subject.name}-${style}-${theme}-${width}`);
}

/**
 * One case per subject at each of its widths, captured in the running instance's style and theme and named
 * after all four, so a failure says which one drew differently. The widths run in turn, so the window is resized
 * once per width rather than once per case.
 */
export function describeVisual(title: string, subjects: readonly VisualSubject[]): void {
  describe(title, () => {
    const widths = [...new Set(subjects.flatMap((subject) => subject.widths ?? [DESKTOP]))];
    const cases = widths.flatMap((width) =>
      subjects
        .filter((subject) => (subject.widths ?? [DESKTOP]).includes(width))
        .map((subject) => ({ subject, width })),
    );
    it.each(cases)('$subject.name at $width', ({ subject, width }) => capture(subject, width));
  });
}
