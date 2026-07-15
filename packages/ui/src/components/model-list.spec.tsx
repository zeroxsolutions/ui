import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ModelList } from './model-list'

afterEach(cleanup)

describe('ModelList', () => {
  it('renders the title, controls, tabs, and children', () => {
    render(
      <ModelList
        title="Model list"
        controls={
          <button type="button">Refresh</button>
        }
        tabs={<div data-testid="tabs" />}
      >
        <div data-testid="child-a" />
        <div data-testid="child-b" />
      </ModelList>,
    )

    expect(screen.getByText('Model list')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy()
    expect(screen.getByTestId('tabs')).toBeTruthy()
    expect(screen.getByTestId('child-a')).toBeTruthy()
    expect(screen.getByTestId('child-b')).toBeTruthy()
  })

  it('renders its children in order without transforming them', () => {
    render(
      <ModelList title="Model list">
        <div data-testid="child">a</div>
        <div data-testid="child">b</div>
        <div data-testid="child">c</div>
      </ModelList>,
    )

    const children = screen.getAllByTestId('child')
    expect(children.map((child) => child.textContent)).toEqual(['a', 'b', 'c'])
  })
})
