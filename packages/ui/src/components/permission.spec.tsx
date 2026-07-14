import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  Permission,
  PermissionActions,
  PermissionResolved,
  PermissionStatus,
  PermissionTitle,
} from './permission'
import {
  SplitButton,
  SplitButtonAction,
  SplitButtonContent,
  SplitButtonItem,
  SplitButtonMenu,
  SplitButtonTrigger,
} from './split-button'
import { Button } from './ui/button'

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

const root = () =>
  document.querySelector('[data-slot="permission"]') as HTMLElement

describe('Permission', () => {
  it('reflects status on the root for selector-driven coordination', () => {
    const { rerender } = render(
      <Permission status="pending">
        <PermissionTitle>Run deploy.sh</PermissionTitle>
      </Permission>,
    )
    expect(root().getAttribute('data-status')).toBe('pending')

    rerender(
      <Permission status="approved">
        <PermissionTitle>Run deploy.sh</PermissionTitle>
      </Permission>,
    )
    expect(root().getAttribute('data-status')).toBe('approved')
  })

  it('shows the per-status badge label', () => {
    render(
      <Permission status="pending">
        <PermissionStatus status="pending" />
      </Permission>,
    )
    screen.getByText('Needs approval')
    cleanup()

    render(
      <Permission status="approved">
        <PermissionStatus status="approved" />
      </Permission>,
    )
    screen.getByText('Allowed')
    cleanup()

    render(
      <Permission status="denied">
        <PermissionStatus status="denied" />
      </Permission>,
    )
    screen.getByText('Denied')
  })

  it('renders an asymmetric row: a plain Deny plus a graduated-scope SplitButton Allow', () => {
    render(
      <Permission status="pending">
        <PermissionActions>
          <Button variant="ghost">Deny</Button>
          <SplitButton>
            <SplitButtonAction variant="default">Allow once</SplitButtonAction>
            <SplitButtonMenu>
              <SplitButtonTrigger variant="default" aria-label="More allow options" />
              <SplitButtonContent>
                <SplitButtonItem>Allow this session</SplitButtonItem>
              </SplitButtonContent>
            </SplitButtonMenu>
          </SplitButton>
        </PermissionActions>
      </Permission>,
    )

    // Deny (1) + Allow action (1) + caret (1) = 3; Deny is a single button, the
    // caret rides the Allow side only.
    expect(screen.getAllByRole('button')).toHaveLength(3)
    screen.getByRole('button', { name: 'Deny' })
    screen.getByRole('button', { name: 'More allow options' })
  })

  it('persists a resolved outcome once the request is decided', () => {
    render(
      <Permission status="approved">
        <PermissionResolved>Allowed once · 2:14pm</PermissionResolved>
      </Permission>,
    )
    screen.getByText(/Allowed once/)
  })
})
