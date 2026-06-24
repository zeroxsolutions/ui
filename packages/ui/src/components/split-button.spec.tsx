import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Circle, Square } from 'lucide-react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { SplitButton } from './split-button'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
  Element.prototype.getAnimations ??= () => []
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

afterEach(cleanup)

const options = [
  { value: 'rect', label: 'Rectangle', icon: Square },
  { value: 'ellipse', label: 'Ellipse', icon: Circle },
] as const

describe('SplitButton', () => {
  it('runs onPrimary for the current option on a primary click', () => {
    const onPrimary = vi.fn()
    render(
      <SplitButton
        options={[...options]}
        value="rect"
        onPrimary={onPrimary}
        onValueChange={() => {}}
        dropdownLabel="Shape tools"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
  })

  it('fires onValueChange with the chosen option from the menu', async () => {
    const onValueChange = vi.fn()
    render(
      <SplitButton
        options={[...options]}
        value="rect"
        onPrimary={() => {}}
        onValueChange={onValueChange}
        dropdownLabel="Shape tools"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Shape tools' }))
    const item = await screen.findByText('Ellipse')
    fireEvent.click(item)
    expect(onValueChange).toHaveBeenCalledWith('ellipse')
  })
})
