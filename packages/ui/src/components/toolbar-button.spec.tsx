import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Circle } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ToolbarButton } from './toolbar-button'

afterEach(cleanup)

describe('ToolbarButton', () => {
  it('uses the label as the accessible name and fires onClick', () => {
    const onClick = vi.fn()
    render(<ToolbarButton label="Rectangle" icon={Circle} onClick={onClick} />)

    const button = screen.getByRole('button', { name: 'Rectangle' })
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(<ToolbarButton label="Rectangle" icon={Circle} onClick={onClick} disabled />)

    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
