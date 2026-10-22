import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NativeCopyPageButton } from './native-copy-page-button';

const url = vi.hoisted(() => ({ search: '' }));

vi.mock('next/navigation', () => ({
  useSearchParams: (): URLSearchParams => new URLSearchParams(url.search),
}));

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  url.search = '';
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const MARKDOWN = { vega: '# Button, in vega', nova: '# Button, in nova' };

describe('NativeCopyPageButton', () => {
  it("copies the page in the URL's style", async () => {
    url.search = '?style=nova';
    render(<NativeCopyPageButton markdown={MARKDOWN} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('# Button, in nova'));
  });

  it('copies the page in the default style where nothing names one', async () => {
    render(<NativeCopyPageButton markdown={MARKDOWN} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('# Button, in vega'));
  });
});
