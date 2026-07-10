import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { CODE_LANGUAGE_IDS } from '../lib/shiki'
import {
  LanguageSwitcher,
  codeLanguageOptions,
  localeOptions,
} from './language-switcher'
import { CODE_LANGUAGE_OPTION_IDS } from './language-switcher-data'

// jsdom shims Base UI's Combobox/ToggleGroup reach for on mount.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
  Element.prototype.getAnimations ??= () => []
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

afterEach(cleanup)

describe('codeLanguageOptions', () => {
  it('offers every highlightable language, each labelled and iconed', () => {
    const options = codeLanguageOptions()
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(option.value).toBeTruthy()
      expect(option.label).toBeTruthy()
      expect(option.icon).toBeTruthy()
    }
  })

  it('renders a Material svg icon for a code language', () => {
    const ts = codeLanguageOptions().find((o) => o.value === 'typescript')
    const { container } = render(<>{ts?.icon}</>)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('stays in sync with the highlighter language set (no drift)', () => {
    expect([...CODE_LANGUAGE_OPTION_IDS].sort()).toEqual(
      [...CODE_LANGUAGE_IDS].sort(),
    )
  })
})

describe('localeOptions', () => {
  it('labels each BCP-47 code with its native language name', () => {
    const byValue = Object.fromEntries(
      localeOptions(['en', 'vi', 'ja']).map((o) => [o.value, o.label]),
    )
    expect(byValue.en).toBe('English')
    // A name was resolved (not the raw code) for the non-English locales.
    expect(byValue.vi).not.toBe('vi')
    expect(byValue.ja).not.toBe('ja')
  })
})

describe('LanguageSwitcher display forms', () => {
  it('renders the dropdown form when used bare, with an accessible trigger', () => {
    render(
      <LanguageSwitcher
        value="en"
        onValueChange={vi.fn()}
        locales={['en', 'vi']}
      />,
    )
    // Base UI's combobox trigger has role="combobox" and carries the accessible name.
    expect(
      screen.getByRole('combobox', { name: /select language/i }),
    ).toBeTruthy()
  })

  it('renders the icon form with an accessible trigger', () => {
    render(
      <LanguageSwitcher.Icon
        value="en"
        onValueChange={vi.fn()}
        locales={['en', 'vi']}
      />,
    )
    expect(
      screen.getByRole('combobox', { name: /select language/i }),
    ).toBeTruthy()
  })

  it('shows the current code language in the dropdown trigger', () => {
    render(
      <LanguageSwitcher.Dropdown
        kind="code"
        value="typescript"
        onValueChange={vi.fn()}
      />,
    )
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
  })

  it('resolves a code alias for display (ts → TypeScript)', () => {
    render(
      <LanguageSwitcher.Dropdown
        kind="code"
        value="ts"
        onValueChange={vi.fn()}
      />,
    )
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
  })
})

describe('LanguageSwitcher.Segmented', () => {
  const localeOpts = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
  ]

  it('renders every option inline and reports a selection (controlled)', () => {
    const onValueChange = vi.fn()
    render(
      <LanguageSwitcher.Segmented
        value="en"
        onValueChange={onValueChange}
        options={localeOpts}
      />,
    )
    expect(screen.getByText('English')).toBeTruthy()
    fireEvent.click(screen.getByText('Tiếng Việt'))
    expect(onValueChange).toHaveBeenCalledWith('vi')
  })

  it('does not deselect on its own — clicking the current option is a no-op', () => {
    const onValueChange = vi.fn()
    render(
      <LanguageSwitcher.Segmented
        value="en"
        onValueChange={onValueChange}
        options={localeOpts}
      />,
    )
    fireEvent.click(screen.getByText('English'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('lets explicit options override the kind data', () => {
    render(
      <LanguageSwitcher.Segmented
        kind="code"
        value="x"
        onValueChange={vi.fn()}
        options={[{ value: 'x', label: 'Custom X' }]}
      />,
    )
    expect(screen.getByText('Custom X')).toBeTruthy()
    expect(screen.queryByText('TypeScript')).toBeNull()
  })
})

describe('LanguageSwitcher.Segmented type contract', () => {
  it('exposes no `searchable` prop (type-level guarantee)', () => {
    const element = (
      // @ts-expect-error `searchable` is not a prop of LanguageSwitcher.Segmented
      <LanguageSwitcher.Segmented value="en" onValueChange={() => {}} searchable />
    )
    expect(element).toBeTruthy()
  })
})
