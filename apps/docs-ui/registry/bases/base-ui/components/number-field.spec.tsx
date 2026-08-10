import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NumberField } from './number-field'

afterEach(cleanup)

describe('NumberField', () => {
  it('evaluates an arithmetic expression and commits the result via onValueChange', () => {
    const onValueChange = vi.fn()
    render(<NumberField value={100} onValueChange={onValueChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '100 + 8' } })
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenCalledWith(108)
  })

  it('clamps the committed value to min/max', () => {
    const onValueChange = vi.fn()
    render(<NumberField value={5} min={0} max={10} onValueChange={onValueChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenCalledWith(10)
  })

  it('blanks the value and shows the consumer placeholder while mixed', () => {
    render(<NumberField value={5} mixed placeholder="Mixed" onValueChange={() => {}} />)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('')
    expect(input.placeholder).toBe('Mixed')
  })

  it('honours a custom parseRaw over the arithmetic evaluator', () => {
    const onValueChange = vi.fn()
    render(
      <NumberField value={0} parseRaw={() => 7} onValueChange={onValueChange} />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'anything' } })
    fireEvent.blur(input)
    expect(onValueChange).toHaveBeenCalledWith(7)
  })

  it('steps the value on ArrowUp/ArrowDown when step is set (clamped)', () => {
    const onValueChange = vi.fn()
    render(
      <NumberField value={5} step={2} max={6} onValueChange={onValueChange} />,
    )

    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    // 5 + 2 = 7, clamped to max 6.
    expect(onValueChange).toHaveBeenLastCalledWith(6)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(onValueChange).toHaveBeenLastCalledWith(3)
  })

  it('leaves the arrows inert when no step is given', () => {
    const onValueChange = vi.fn()
    render(<NumberField value={5} onValueChange={onValueChange} />)

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
