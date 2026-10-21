import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NativeRegistryEntry } from './native-registry-entry';

const url = vi.hoisted(() => ({ search: '' }));

vi.mock('next/navigation', () => ({
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

const ORIGIN = 'https://ui.zeroxsolutions.com';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  url.search = '';
});

describe('NativeRegistryEntry', () => {
  it("names the engine's registry in the default style where neither the URL nor the reader names one", async () => {
    render(<NativeRegistryEntry engine="nativewind" origin={ORIGIN} />);

    expect(await screen.findByText(/"style": "nativewind-vega"/)).toBeTruthy();
    expect(
      screen.getByText(/"@zui": "https:\/\/ui\.zeroxsolutions\.com\/r\/styles\/\{style\}\/\{name\}\.json"/),
    ).toBeTruthy();
  });

  it("names the URL's style over the one the reader picked last", async () => {
    localStorage.setItem('zui:style:native', 'vega');
    url.search = '?style=nova';

    render(<NativeRegistryEntry engine="uniwind" origin={ORIGIN} />);

    expect(await screen.findByText(/"style": "uniwind-nova"/)).toBeTruthy();
  });
});
