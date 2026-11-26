import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { TestHost } from '../../../test/test-host';

import { StylePicker } from './style-picker';

// The page is drawn in its style by an inline script on `<html>` before any module loads, so until the picker
// hydrates, its label is the markup the server rendered with no query and no remembered choice.
describe('StylePicker before it hydrates', () => {
  const container = document.createElement('div');

  afterEach(() => {
    container.remove();
    document.documentElement.classList.remove('style-sera');
  });

  it('names the style the page is drawn in, not the default the server rendered', async () => {
    document.documentElement.classList.add('style-sera');
    container.innerHTML = renderToString(
      <TestHost pathname="/docs/installation">
        <StylePicker platform="web" />
      </TestHost>,
    );
    document.body.append(container);

    await expect.element(page.getByRole('button', { name: 'Style Sera' })).toBeVisible();
  });
});
