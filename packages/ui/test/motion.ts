import { afterAll, beforeAll, beforeEach, expect, vi } from 'vitest';
import { cdp } from 'vitest/browser';

import { drawingsOver } from '../src/test/drawings-over';
import { mouse } from './pointer';

/** How long a control's icon is watched for a play; longer than the slowest icon takes to leave its rest drawing. */
const WATCH_MS = 600;

/**
 * Lets Motion play for the cases of the calling `describe`, as for a reader who asked for no reduced motion. The
 * browser project runs as one who did, so every other spec keeps a still page; the setting is put back after.
 */
export function playMotion(): void {
  beforeAll(async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    await vi.waitFor(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) throw new Error('motion is still reduced');
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  // The pointer rests where the last case left it, and a control drawn under it takes the pointer's enter before its
  // icon is drawn, so a hover would not be a change; it is moved past the page's far corner first.
  beforeEach(async () => {
    await mouse('move', { x: innerWidth - 1, y: innerHeight - 1 });
  });
  afterAll(async () => {
    await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  });
}

/** The svg drawn inside `control`, as markup, so a frame of an animation reads differently from the rest drawing. */
export function drawingIn(control: Element): string {
  return control.querySelector('svg')?.outerHTML ?? '';
}

/** Every drawing of the svg inside `control` over `ms`, read on each of the browser's frames. */
export function drawingsIn(control: Element, ms = WATCH_MS): Promise<Set<string>> {
  return drawingsOver(() => drawingIn(control), ms);
}

/** Passes once the svg inside `control` is drawn other than `rest` on some frame, which is its icon playing. */
export async function expectPlaying(control: Element, rest: string): Promise<void> {
  expect(
    [...(await drawingsIn(control))].some((drawing) => drawing !== rest),
    'the icon plays',
  ).toBe(true);
}

/** Passes once the svg inside `control` keeps one drawing across the watch, which is its icon at rest. */
export async function expectStill(control: Element): Promise<void> {
  expect((await drawingsIn(control)).size, 'the icon stays still').toBe(1);
}

/** Resolves once the icon inside `control` has come to rest, answering its rest drawing. */
export async function settled(control: Element): Promise<string> {
  await expect.poll(async () => (await drawingsIn(control, 200)).size, { timeout: 5000 }).toBe(1);
  return drawingIn(control);
}
