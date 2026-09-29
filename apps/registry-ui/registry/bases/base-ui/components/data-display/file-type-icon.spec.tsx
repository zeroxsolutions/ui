import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FileTypeIcon } from './file-type-icon';

afterEach(cleanup);

describe('FileTypeIcon', () => {
  it('renders an svg marked as the file type icon', () => {
    const { container } = render(<FileTypeIcon name="run.py" />);
    expect(container.querySelector('svg[data-slot="file-type-icon"]')).toBeTruthy();
  });

  it('passes its svg props through', () => {
    const { container } = render(<FileTypeIcon name="logo.png" aria-label="Image file" className="size-3" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Image file');
    expect(svg?.getAttribute('class')).toContain('size-3');
  });
});
