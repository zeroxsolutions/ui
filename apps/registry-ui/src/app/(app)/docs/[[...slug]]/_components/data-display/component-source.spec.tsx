import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  SourceCodeBlockCode,
  SourceCodeBlockContent,
  SourceCodeBlockCopy,
} from '@/components/data-display/source-code-block';

import { ComponentSource } from './component-source';

afterEach(cleanup);

const CODE = 'const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;';

describe('ComponentSource', () => {
  it('shows the parts its caller composes, and nothing else', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts">
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const d = 4;/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('cuts the source to its first lines when asked', () => {
    render(
      <ComponentSource name="x" code={CODE} language="ts" maxLines={2}>
        <SourceCodeBlockCopy />
        <SourceCodeBlockContent>
          <SourceCodeBlockCode />
        </SourceCodeBlockContent>
      </ComponentSource>,
    );
    expect(screen.getByText(/const b = 2;/)).toBeTruthy();
    expect(screen.queryByText(/const c = 3;/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('throws outside a docs page, where nothing read its source', () => {
    expect(() => render(<ComponentSource name="x" />)).toThrow(/has no source/);
  });
});
