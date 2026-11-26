import { cdp } from 'vitest/browser';

/** A point in the spec's own viewport, as `getBoundingClientRect` reads one. */
export interface Point {
  x: number;
  y: number;
}

/** The centre of `element`, in the spec's own viewport. */
export function centreOf(element: Element): Point {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** `point` in the page around the spec's frame, where the browser's input lands. */
function onPage({ x, y }: Point): Point {
  const frame = window.frameElement?.getBoundingClientRect();
  const scale = frame && window.innerWidth > 0 ? frame.width / window.innerWidth : 1;
  return { x: (frame?.left ?? 0) + x * scale, y: (frame?.top ?? 0) + y * scale };
}

/**
 * A mouse's press, move or release at `point`, carried out by the browser's own input, as a person's is; unlike
 * `userEvent.dragAndDrop`, a spec can press a key between the press and the release.
 */
export async function mouse(type: 'press' | 'move' | 'release', point: Point): Promise<void> {
  const at = onPage(point);
  await cdp().send('Input.dispatchMouseEvent', {
    type: type === 'press' ? 'mousePressed' : type === 'move' ? 'mouseMoved' : 'mouseReleased',
    x: at.x,
    y: at.y,
    button: 'left',
    buttons: type === 'release' ? 0 : 1,
    clickCount: type === 'move' ? 0 : 1,
  });
}

/**
 * A finger's touch, move or lift at `point`, carried out by the browser's own touch input; the page reads it as
 * pointer events of type `touch`.
 */
export async function touch(type: 'start' | 'move' | 'end', point: Point): Promise<void> {
  const at = onPage(point);
  await cdp().send('Input.dispatchTouchEvent', {
    type: type === 'start' ? 'touchStart' : type === 'move' ? 'touchMove' : 'touchEnd',
    touchPoints: type === 'end' ? [] : [{ x: at.x, y: at.y }],
  });
}
