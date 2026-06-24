import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ConfirmButton } from './confirm-button'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  // Base UI's dialog reads getAnimations on open/close, absent in jsdom.
  Element.prototype.getAnimations ??= () => []
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

afterEach(cleanup)

describe('ConfirmButton', () => {
  it('runs onConfirm only after the user confirms in the dialog', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmButton
        title="Clear conversations?"
        actionLabel="Clear"
        destructive
        onConfirm={onConfirm}
      >
        Clear all
      </ConfirmButton>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    await waitFor(() =>
      expect(screen.getByText('Clear conversations?')).toBeTruthy(),
    )
    // Opening the dialog must not have fired the action yet.
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
