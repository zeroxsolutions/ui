import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeRegistryEntry } from './native-registry-entry';

const url = { search: '' };

/** A host answering the query the spec last set on `url`. */
function UrlHost({ children }: { children: ReactNode }): ReactNode {
  return <TestHost search={url.search}>{children}</TestHost>;
}

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
    render(<NativeRegistryEntry engine="nativewind" origin={ORIGIN} />, { wrapper: UrlHost });

    expect(await screen.findByText(/"style": "nativewind-vega"/)).toBeTruthy();
    expect(
      screen.getByText(/"@zui": "https:\/\/ui\.zeroxsolutions\.com\/r\/styles\/\{style\}\/\{name\}\.json"/),
    ).toBeTruthy();
  });

  it("names the URL's style over the one the reader picked last", async () => {
    localStorage.setItem('zui:style:native', 'vega');
    url.search = '?style=nova';

    render(<NativeRegistryEntry engine="uniwind" origin={ORIGIN} />, { wrapper: UrlHost });

    expect(await screen.findByText(/"style": "uniwind-nova"/)).toBeTruthy();
  });
});
