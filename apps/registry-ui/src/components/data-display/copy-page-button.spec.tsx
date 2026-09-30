import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CopyPageButton } from './copy-page-button';

const MARKDOWN = '# Status Indicator\n';

let requested: string[] = [];

const server = setupServer(
  http.get('*/docs/components/status-indicator.md', ({ request }) => {
    requested.push(new URL(request.url).pathname);
    return HttpResponse.text(MARKDOWN);
  }),
  http.get('*/docs/missing.md', ({ request }) => {
    requested.push(new URL(request.url).pathname);
    return new HttpResponse(null, { status: 404 });
  }),
);

let writeText: ReturnType<typeof vi.fn>;

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  requested = [];
  writeText = vi.fn(() => Promise.resolve());
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('CopyPageButton', () => {
  it("fetches the page's Markdown and writes it to the clipboard", async () => {
    render(<CopyPageButton url="/docs/components/status-indicator" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(MARKDOWN));
    expect(requested).toEqual(['/docs/components/status-indicator.md']);
  });

  it('writes nothing when the Markdown does not come back', async () => {
    render(<CopyPageButton url="/docs/missing" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(requested).toEqual(['/docs/missing.md']));
    // Let the refused fetch settle through both attempts before looking.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(writeText).not.toHaveBeenCalled();
  });
});
