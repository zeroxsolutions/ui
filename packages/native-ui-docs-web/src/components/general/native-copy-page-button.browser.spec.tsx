import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { PLATFORM_STYLES } from '@zeroxsolutions/ui/site/constants/platform-styles';
import { TestHost } from '@zeroxsolutions/ui/test/test-host';

import { NativeCopyPageButton } from './native-copy-page-button';

const MARKDOWN = Object.fromEntries(PLATFORM_STYLES.native.map((style) => [style, `# Button, in ${style}`])) as Record<
  (typeof PLATFORM_STYLES.native)[number],
  string
>;

async function renderAt(search: string): Promise<void> {
  await render(
    <TestHost search={search}>
      <NativeCopyPageButton markdown={MARKDOWN} />
    </TestHost>,
  );
}

describe('NativeCopyPageButton', () => {
  it("copies the page in the URL's style", async () => {
    await renderAt('?style=nova');

    await userEvent.click(page.getByRole('button', { name: 'Copy page' }));

    await expect.poll(() => navigator.clipboard.readText()).toBe('# Button, in nova');
  });

  it('copies the page in the default style where nothing names one', async () => {
    await renderAt('');

    await userEvent.click(page.getByRole('button', { name: 'Copy page' }));

    await expect.poll(() => navigator.clipboard.readText()).toBe('# Button, in vega');
  });
});
