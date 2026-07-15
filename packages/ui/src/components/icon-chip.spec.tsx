import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { IconChip } from './icon-chip'

afterEach(cleanup)

describe('IconChip', () => {
  it('renders the icon inside a container styled by the tint', () => {
    render(
      <IconChip
        icon={<svg data-testid="glyph" />}
        label="Vision input"
        tint="bg-emerald-500/15 text-emerald-600"
      />,
    )

    expect(screen.getByTestId('glyph')).toBeTruthy()
    const container = document.querySelector('[data-slot="icon-chip"]')
    expect(container?.className).toContain('bg-emerald-500/15')
    expect(container?.className).toContain('text-emerald-600')
  })

  it('exposes a string label as the accessible name', () => {
    render(<IconChip icon={<svg />} label="Reasoning" tint="bg-violet-500/15" />)

    expect(document.querySelector('[aria-label="Reasoning"]')).toBeTruthy()
  })

  it('carries no built-in capability set - only the supplied icon renders', () => {
    render(
      <IconChip icon={<svg data-testid="only" />} label="Function calling" />,
    )

    expect(screen.getAllByTestId('only')).toHaveLength(1)
  })
})
