import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ComponentSource } from './component-source';

const code = ['const a = 1;', 'const b = 2;', 'const c = 3;'].join('\n');
const lines = JSON.stringify(code.split('\n').map((line) => [{ content: line }]));

afterEach(cleanup);

describe('ComponentSource', () => {
  it('numbers each line, beside a copy of the source as it is', () => {
    render(<ComponentSource name="demo" code={code} language="ts" lines={lines} />);

    expect(document.querySelector('[data-slot="code-block-line-numbers"]')?.textContent).toBe('1\n2\n3');
    expect(document.querySelector('[data-slot="highlighted-code"]')?.textContent).toBe(code);
  });

  it('cut to its first lines, shows those alone and offers nothing to copy', () => {
    render(<ComponentSource name="demo" code={code} language="ts" lines={lines} maxLines={2} copyable={false} />);

    expect(document.querySelector('[data-slot="highlighted-code"]')?.textContent).toBe('const a = 1;\nconst b = 2;');
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('throws outside a docs page, where nothing read its source', () => {
    expect(() => render(<ComponentSource name="demo" />)).toThrow(/demo/);
  });
});
