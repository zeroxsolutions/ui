import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ComponentSource } from './component-source';

const code = ['const a = 1;', 'const b = 2;', 'const c = 3;'].join('\n');
const lines = JSON.stringify(code.split('\n').map((line) => [{ content: line }]));

afterEach(cleanup);

describe('ComponentSource', () => {
  it('numbers each line, beside a copy of the source as it is', () => {
    const { container } = render(<ComponentSource name="demo" code={code} language="ts" lines={lines} />);

    expect(container.querySelector('pre')?.textContent).toBe(`1\n2\n3${code}`);
    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeTruthy();
  });

  it('cut to its first lines, shows those alone and offers nothing to copy', () => {
    const { container } = render(
      <ComponentSource name="demo" code={code} language="ts" lines={lines} maxLines={2} copyable={false} />,
    );

    expect(container.querySelector('code')?.textContent).toBe('const a = 1;\nconst b = 2;');
    expect(screen.queryByRole('button', { name: 'Copy code' })).toBeNull();
  });

  it('throws outside a docs page, where nothing read its source', () => {
    expect(() => render(<ComponentSource name="demo" />)).toThrow(/demo/);
  });
});
