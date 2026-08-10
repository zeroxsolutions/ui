import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  MenuButton,
  MenuButtonAction,
  MenuButtonContent,
  MenuButtonMenu,
  MenuButtonRadioGroup,
  MenuButtonRadioItem,
  MenuButtonTrigger,
} from './menu-button'

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

const LABELS: Record<string, string> = { once: 'Allow once', all: 'Allow all' }

function Example({
  value = 'once',
  onRun = () => {},
  onValueChange = () => {},
}: {
  value?: string
  onRun?: () => void
  onValueChange?: (value: string) => void
}) {
  return (
    <MenuButton>
      <MenuButtonAction onClick={onRun}>{LABELS[value]}</MenuButtonAction>
      <MenuButtonMenu>
        <MenuButtonTrigger aria-label="Change grant scope" />
        <MenuButtonContent>
          <MenuButtonRadioGroup value={value} onValueChange={onValueChange}>
            <MenuButtonRadioItem value="once">Allow once</MenuButtonRadioItem>
            <MenuButtonRadioItem value="all">Allow all</MenuButtonRadioItem>
          </MenuButtonRadioGroup>
        </MenuButtonContent>
      </MenuButtonMenu>
    </MenuButton>
  )
}

describe('MenuButton', () => {
  it("primary repeats the current action and fires it (label reflects value)", () => {
    const onRun = vi.fn()
    render(<Example value="all" onRun={onRun} />)

    // the primary shows the CURRENT value's label, not a fixed default
    fireEvent.click(screen.getByRole('button', { name: 'Allow all' }))
    expect(onRun).toHaveBeenCalledTimes(1)
  })

  it('the caret menu marks the current scope as checked (value flows to the group)', async () => {
    const onRun = vi.fn()
    render(<Example value="all" onRun={onRun} />)

    fireEvent.click(screen.getByRole('button', { name: 'Change grant scope' }))
    const all = await screen.findByRole('menuitemradio', { name: 'Allow all' })
    const once = screen.getByRole('menuitemradio', { name: 'Allow once' })

    // the current value is the checked default; the other is not — this is what
    // makes the primary "remember" the last-picked action (selection firing is
    // Base UI's radio behaviour, exercised in the browser, not here)
    expect(all.getAttribute('aria-checked')).toBe('true')
    expect(once.getAttribute('aria-checked')).toBe('false')
    // opening the menu never runs the action
    expect(onRun).not.toHaveBeenCalled()
  })
})
