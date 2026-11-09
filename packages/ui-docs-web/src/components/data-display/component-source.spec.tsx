import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  SourceCodeCardCode,
  SourceCodeCardContent,
  SourceCodeCardCopy,
} from '@zeroxsolutions/ui/site/components/data-display/source-code-card';

import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { ComponentSource } from './component-source';

afterEach(cleanup);

const CODE = 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;';

describe('ComponentSource', () => {
  it('shows the parts its caller composes, and nothing else', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts">
        <SourceCodeCardContent>
          <SourceCodeCardCode />
        </SourceCodeCardContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const d = 4;/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('cuts the source to its first lines when asked', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts" maxLines={2}>
        <SourceCodeCardCopy />
        <SourceCodeCardContent>
          <SourceCodeCardCode />
        </SourceCodeCardContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const b = 2;/)).toBeTruthy();
    expect(screen.queryByText(/const c = 3;/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it("shows the page's style's code, and the default's for a style that writes it the same", async () => {
    const styleSources = JSON.stringify({ vega: { code: "const card = 'rounded-md';", lines: 'null' } });
    const renderIn = (search: string) =>
      render(
        <TestHost search={search}>
          <ComponentSource name="x" code="const card = 'rounded-lg';" language="ts" styleSources={styleSources}>
            <SourceCodeCardContent>
              <SourceCodeCardCode />
            </SourceCodeCardContent>
          </ComponentSource>
        </TestHost>,
      );
    renderIn('style=vega');
    expect(await screen.findByText(/rounded-md/)).toBeTruthy();
    cleanup();
    renderIn('style=lyra');
    expect(await screen.findByText(/rounded-lg/)).toBeTruthy();
  });

  it('throws outside a docs page, where nothing read its source', () => {
    expect(() => render(<ComponentSource name="x" />)).toThrow(/has no source/);
  });
});
