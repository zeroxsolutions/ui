import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HighlightedCode } from './highlighted-code';

afterEach(cleanup);

describe('HighlightedCode', () => {
  it('shows its raw children while it has no lines', () => {
    render(<HighlightedCode lines={null}>const x = 1</HighlightedCode>);
    expect(screen.getByText('const x = 1')).toBeTruthy();
  });

  it('paints each token in its own colour, a newline between lines, in place of the children', () => {
    const { container } = render(
      <HighlightedCode
        lines={[[{ content: 'const', style: { color: 'rgb(1, 2, 3)' } }, { content: ' x' }], [{ content: '}' }]]}
      >
        raw
      </HighlightedCode>,
    );
    expect(container.querySelector('[data-slot=highlighted-code]')?.textContent).toBe('const x\n}');
    expect(screen.getByText('const').style.color).toBe('rgb(1, 2, 3)');
    expect(screen.queryByText('raw')).toBeNull();
  });
});
