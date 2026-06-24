import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TreeRow } from './tree-row'

afterEach(cleanup)

describe('TreeRow', () => {
  it('indents by baseIndent + depth * indentStep', () => {
    const { container } = render(
      <TreeRow depth={2} indentStep={12} baseIndent={4} hasChildren={false} expanded={false} onToggleExpand={() => {}}>
        <span>node</span>
      </TreeRow>,
    )
    expect((container.firstElementChild as HTMLElement).style.paddingLeft).toBe('28px')
  })

  it('toggles via the chevron and stops propagation so the row is not selected', () => {
    const onToggleExpand = vi.fn()
    const onRowClick = vi.fn()
    render(
      <div onClick={onRowClick}>
        <TreeRow depth={0} hasChildren expanded={false} onToggleExpand={onToggleExpand} expandLabel="Expand node">
          <span>node</span>
        </TreeRow>
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }))
    expect(onToggleExpand).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('renders an aligned spacer (no disclosure button) for a leaf', () => {
    render(
      <TreeRow depth={0} hasChildren={false} expanded={false} onToggleExpand={() => {}}>
        <span>leaf</span>
      </TreeRow>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })
})
