import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { FontPreview } from './font-preview';

describe('FontPreview', () => {
  it('keeps a src or format that tries to close the rule inside its string, leaving the page styles alone', async () => {
    await render(
      <>
        <p>Sentinel</p>
        <FontPreview
          src={'/x.woff2"); } p { display: none; } \\ @font-face { src: url("'}
          format={'woff2") } * { color: red } x { a: ("'}
        />
      </>,
    );

    await expect.element(page.getByText('Sentinel')).toBeVisible();
    const style = page.getByTestId('font-preview').element().querySelector('style');
    expect(style?.sheet?.cssRules).toHaveLength(1);
  });
});
