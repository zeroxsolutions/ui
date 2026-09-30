import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FileTypeIcon } from './file-type-icon';

afterEach(cleanup);

describe('FileTypeIcon', () => {
  it('is hidden from assistive technology unless it is labelled', () => {
    const { container } = render(<FileTypeIcon name="run.py" />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is announced by the label it is given', () => {
    render(<FileTypeIcon name="logo.png" aria-label="Image file" />);
    expect(screen.getByLabelText('Image file').tagName.toLowerCase()).toBe('svg');
  });
});
