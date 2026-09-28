import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CopyButton } from './copy-button';

afterEach(cleanup);

describe('CopyButton', () => {
  it('renders with the default accessible name', () => {
    const { getByLabelText } = render(<CopyButton value="hello" />);
    expect(getByLabelText('Copy')).toBeTruthy();
  });

  it('honors a custom label and passes className through', () => {
    const { getByLabelText } = render(<CopyButton value="x" label="Copy source" className="size-6" />);
    expect(getByLabelText('Copy source').className).toContain('size-6');
  });

  it('copies the value and flips to the copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { getByLabelText, findByLabelText } = render(<CopyButton value="payload" copiedLabel="Copied!" />);
    fireEvent.click(getByLabelText('Copy'));
    expect(writeText).toHaveBeenCalledWith('payload');
    await findByLabelText('Copied!');
  });
});
