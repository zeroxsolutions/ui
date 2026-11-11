import {
  RESIZE_DRAG_THRESHOLD as WEB_THRESHOLD,
  shouldStartDrag as shouldStartDragOnTheWeb,
} from '@zeroxsolutions/ui/registry/bases/base-ui/lib/resize-drag';
import { RESIZE_DRAG_THRESHOLD, shouldStartDrag } from './resize-drag';

describe('shouldStartDrag', () => {
  it('stays false within the threshold, so a tap or a jitter never resizes', () => {
    expect(shouldStartDrag(100, 100)).toBe(false);
    expect(shouldStartDrag(100, 103)).toBe(false);
    expect(shouldStartDrag(100, 97)).toBe(false);
  });

  it('starts once the finger has moved the threshold, either way', () => {
    expect(shouldStartDrag(100, 100 + RESIZE_DRAG_THRESHOLD)).toBe(true);
    expect(shouldStartDrag(100, 100 - RESIZE_DRAG_THRESHOLD)).toBe(true);
  });

  it('honours a threshold the caller gives', () => {
    expect(shouldStartDrag(0, 9, 10)).toBe(false);
    expect(shouldStartDrag(0, 10, 10)).toBe(true);
  });

  it('starts a drag where the web starts one, at the same threshold', () => {
    const moves: [number, number, number?][] = [
      [0, 0],
      [0, 3],
      [0, 3.9],
      [0, 4],
      [0, -4],
      [0, -3.5],
      [50, 46],
      [50, 120],
      [0, 9, 10],
      [0, 10, 10],
      [0, 1, 0],
    ];
    expect(RESIZE_DRAG_THRESHOLD).toBe(WEB_THRESHOLD);
    expect(moves.map((move) => shouldStartDrag(...move))).toEqual(
      moves.map((move) => shouldStartDragOnTheWeb(...move)),
    );
  });
});
