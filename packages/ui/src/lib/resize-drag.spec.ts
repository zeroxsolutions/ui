import { describe, expect, it } from 'vitest'

import { RESIZE_DRAG_THRESHOLD, shouldStartDrag } from './resize-drag'

describe('shouldStartDrag', () => {
  it('stays false within the threshold (clicks / jitter / double-click)', () => {
    expect(shouldStartDrag(100, 100)).toBe(false)
    expect(shouldStartDrag(100, 103)).toBe(false)
    expect(shouldStartDrag(100, 97)).toBe(false)
  })

  it('starts once movement crosses the threshold (either direction)', () => {
    expect(shouldStartDrag(100, 100 + RESIZE_DRAG_THRESHOLD)).toBe(true)
    expect(shouldStartDrag(100, 100 - RESIZE_DRAG_THRESHOLD)).toBe(true)
    expect(shouldStartDrag(100, 200)).toBe(true)
  })

  it('honours a custom threshold', () => {
    expect(shouldStartDrag(0, 9, 10)).toBe(false)
    expect(shouldStartDrag(0, 10, 10)).toBe(true)
  })
})
