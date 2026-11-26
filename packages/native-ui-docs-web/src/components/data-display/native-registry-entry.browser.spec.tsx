import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeRegistryEntry } from './native-registry-entry';

const ORIGIN = 'https://ui.zeroxsolutions.com';

afterEach(() => {
  localStorage.clear();
});

describe('NativeRegistryEntry', () => {
  it("names the engine's registry in the default style where neither the URL nor the reader names one", async () => {
    const { container } = await render(
      <TestHost>
        <NativeRegistryEntry engine="nativewind" origin={ORIGIN} />
      </TestHost>,
    );

    await expect.element(container).toHaveTextContent('"style": "nativewind-vega"');
    await expect.element(container).toHaveTextContent(`"@zui": "${ORIGIN}/r/styles/{style}/{name}.json"`);
  });

  it("names the URL's style over the one the reader picked last", async () => {
    localStorage.setItem('zui:style:native', 'vega');

    const { container } = await render(
      <TestHost search="style=nova">
        <NativeRegistryEntry engine="uniwind" origin={ORIGIN} />
      </TestHost>,
    );

    await expect.element(container).toHaveTextContent('"style": "uniwind-nova"');
  });
});
