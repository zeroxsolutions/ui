import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PLATFORM_STYLES } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeCopyPageButton } from './native-copy-page-button';

const url = { search: '' };

/** A host answering the query the spec last set on `url`. */
function UrlHost({ children }: { children: ReactNode }): ReactNode {
  return <TestHost search={url.search}>{children}</TestHost>;
}

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

const MARKDOWN = Object.fromEntries(PLATFORM_STYLES.native.map((style) => [style, `# Button, in ${style}`])) as Record<
  (typeof PLATFORM_STYLES.native)[number],
  string
>;

describe('NativeCopyPageButton', () => {
  it("copies the page in the URL's style", async () => {
    url.search = '?style=nova';
    render(<NativeCopyPageButton markdown={MARKDOWN} />, { wrapper: UrlHost });

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('# Button, in nova'));
  });

  it('copies the page in the default style where nothing names one', async () => {
    render(<NativeCopyPageButton markdown={MARKDOWN} />, { wrapper: UrlHost });

    fireEvent.click(screen.getByRole('button', { name: 'Copy page' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('# Button, in vega'));
  });
});
