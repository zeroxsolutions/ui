import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestHost } from '../../../test/test-host';

import { StylePicker } from './style-picker';

const chevron = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));
const check = vi.hoisted(() => ({ startAnimation: vi.fn(), stopAnimation: vi.fn() }));

// The icons' handles are the seam: the picker drives them, and the motion behind them is the icons' own.
vi.mock('../../../../registry/bases/base-ui/icons/lucide/chevron-down-icon', () => ({
  ChevronDownIcon: forwardRef(function ChevronDownIcon(_props, ref) {
    useImperativeHandle(ref, () => chevron);
    return null;
  }),
}));
vi.mock('../../../../registry/bases/base-ui/icons/lucide/check-icon', () => ({
  CheckIcon: forwardRef(function CheckIcon(_props, ref) {
    useImperativeHandle(ref, () => check);
    return null;
  }),
}));

const BUTTON = '/native/components/nativewind/button';

const url = { pathname: '', search: '' };

function wrapper({ children }: { children: ReactNode }): ReactNode {
  return (
    <TestHost pathname={url.pathname} search={url.search}>
      {children}
    </TestHost>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  url.pathname = BUTTON;
  url.search = '';
});

function openPicker(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Style/ }));
}

describe('StylePicker', () => {
  it("shows a pasted link's style over the one the reader picked last", () => {
    localStorage.setItem('zui:style:native', 'nova');
    url.search = '?style=vega';

    render(<StylePicker platform="native" />, { wrapper });

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Vega');
  });

  it('shows the style the reader picked last where the URL names none', () => {
    localStorage.setItem('zui:style:native', 'nova');

    render(<StylePicker platform="native" />, { wrapper });

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Nova');
  });

  it("links each of the platform's styles, writing no ?style= for the default and keeping the rest of the query", async () => {
    url.search = '?style=nova&q=x';
    render(<StylePicker platform="native" />, { wrapper });

    openPicker();

    const vega = await screen.findByRole('menuitem', { name: 'Vega' });
    const nova = screen.getByRole('menuitem', { name: 'Nova' });
    expect(vega.getAttribute('href')).toBe(`${BUTTON}?q=x`);
    expect(nova.getAttribute('href')).toBe(`${BUTTON}?style=nova&q=x`);
    expect(nova.getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByRole('menuitem')).toHaveLength(8);
  });

  it('lists the web styles on a web page', async () => {
    url.pathname = '/docs/installation';
    render(<StylePicker platform="web" />, { wrapper });

    openPicker();

    expect((await screen.findByRole('menuitem', { name: 'Nova' })).getAttribute('href')).toBe('/docs/installation');
    expect(screen.getByRole('menuitem', { name: 'Rhea' }).getAttribute('href')).toBe('/docs/installation?style=rhea');
    expect(screen.getAllByRole('menuitem')).toHaveLength(8);
  });

  it('remembers the style a reader picks, for pages whose URL names none', async () => {
    url.pathname = '/native/docs';
    render(<StylePicker platform="native" />, { wrapper });
    openPicker();

    fireEvent.click(await screen.findByRole('menuitem', { name: 'Nova' }));

    expect(screen.getByRole('button', { name: /^Style/ }).textContent).toContain('Nova');
  });

  it("plays the trigger's icon while the pointer or the focus is on it, and stops it as either leaves", () => {
    render(<StylePicker platform="native" />, { wrapper });
    const trigger = screen.getByRole('button', { name: /^Style/ });

    fireEvent.pointerEnter(trigger);
    expect(chevron.startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.pointerLeave(trigger);
    expect(chevron.stopAnimation).toHaveBeenCalledTimes(1);

    fireEvent.focus(trigger);
    expect(chevron.startAnimation).toHaveBeenCalledTimes(2);
    fireEvent.blur(trigger);
    expect(chevron.stopAnimation).toHaveBeenCalledTimes(2);
  });

  it('plays the check of the style in use as the menu opens on it, and as the highlight comes back to it', async () => {
    url.search = '?style=nova';
    render(<StylePicker platform="native" />, { wrapper });
    openPicker();
    const nova = await screen.findByRole('menuitem', { name: 'Nova' });
    const vega = screen.getByRole('menuitem', { name: 'Vega' });

    fireEvent.focus(nova);
    expect(check.startAnimation).toHaveBeenCalledTimes(1);
    fireEvent.blur(nova);
    expect(check.stopAnimation).toHaveBeenCalledTimes(1);

    fireEvent.pointerEnter(vega);
    expect(check.startAnimation).toHaveBeenCalledTimes(1);

    fireEvent.pointerEnter(nova);
    expect(check.startAnimation).toHaveBeenCalledTimes(2);
    fireEvent.pointerLeave(nova);
    expect(check.stopAnimation).toHaveBeenCalledTimes(2);
  });
});
