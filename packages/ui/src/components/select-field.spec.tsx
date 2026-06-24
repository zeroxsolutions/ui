import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { SelectField } from './select-field'

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
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
]

describe('SelectField', () => {
  it('shows the consumer placeholder (not a baked string) while mixed', () => {
    render(
      <SelectField
        label="Align"
        value="left"
        onValueChange={() => {}}
        options={options}
        mixed
        placeholder="Mixed"
      />,
    )
    expect(screen.getByText('Mixed')).toBeTruthy()
  })

  it('opens to the provided options', async () => {
    render(
      <SelectField label="Align" value="left" onValueChange={() => {}} options={options} />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('option', { name: 'Center' })).toBeTruthy()
  })
})
