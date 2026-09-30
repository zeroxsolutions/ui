import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyPageButton } from './copy-page-button';

let writeText: ReturnType<typeof vi.fn>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  fetchMock = vi.fn(() => Promise.resolve(new Response('# Status Indicator\n', { status: 200 })));
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CopyPageButton', () => {
  it("fetches the page's Markdown and writes it to the clipboard", async () => {
    render(<CopyPageButton url="/docs/components/status-indicator" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('# Status Indicator\n'));
    expect(fetchMock).toHaveBeenCalledWith('/docs/components/status-indicator.md');
  });

  it('writes nothing when the Markdown does not come back', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 404 })));
    render(<CopyPageButton url="/docs/missing" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    // Let the rejected fetch settle through both attempts before looking.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(writeText).not.toHaveBeenCalled();
  });
});
