import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { MonoChip } from './mono-chip'

afterEach(cleanup)

describe('MonoChip', () => {
  it('renders its children with the mono pill classes', () => {
    const { getByText } = render(<MonoChip>abc123</MonoChip>)
    const el = getByText('abc123')
    expect(el.className).toContain('font-mono')
    expect(el.className).toContain('bg-muted')
  })

  it('forwards title and merges className', () => {
    const { getByText } = render(
      <MonoChip title="full value" className="max-w-12 truncate">
        x
      </MonoChip>,
    )
    const el = getByText('x')
    expect(el.getAttribute('title')).toBe('full value')
    expect(el.className).toContain('truncate')
  })
})
