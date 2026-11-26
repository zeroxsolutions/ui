import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CodeInputDemo } from './code-input-demo';

describe('CodeInputDemo', () => {
  it('fills the code as it is typed, and offers Verify only once all six digits are in', async () => {
    await render(<CodeInputDemo />);
    const code = page.getByLabelText('Verification code');
    const verify = page.getByRole('button', { name: 'Verify' });

    await userEvent.type(code, '482');

    await expect.element(code).toHaveValue('482');
    await expect.element(verify).toBeDisabled();

    await userEvent.type(code, '913');

    await expect.element(code).toHaveValue('482913');
    await expect.element(verify).toBeEnabled();
  });

  it('takes the whole code from one paste', async () => {
    await render(
      <>
        <input aria-label="Message" defaultValue="482913" />
        <CodeInputDemo />
      </>,
    );
    await userEvent.tripleClick(page.getByLabelText('Message'));
    await userEvent.copy();

    await userEvent.click(page.getByLabelText('Verification code'));
    await userEvent.paste();

    await expect.element(page.getByLabelText('Verification code')).toHaveValue('482913');
    await expect.element(page.getByRole('button', { name: 'Verify' })).toBeEnabled();
  });
});
