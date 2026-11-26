import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { CopyButton } from './copy-button';

/** Pastes the clipboard into a field of its own and answers what landed there. */
async function pasted(): Promise<string> {
  const field = document.createElement('textarea');
  field.setAttribute('aria-label', 'Paste target');
  document.body.append(field);
  await userEvent.click(page.getByRole('textbox', { name: 'Paste target' }));
  await userEvent.paste();
  const text = field.value;
  field.remove();
  return text;
}

describe('CopyButton', () => {
  it('renders with the default accessible name', async () => {
    await render(<CopyButton value="hello" />);
    await expect.element(page.getByRole('button', { name: 'Copy' })).toBeVisible();
  });

  it('honors a custom label', async () => {
    await render(<CopyButton value="x" label="Copy source" />);
    await expect.element(page.getByRole('button', { name: 'Copy source' })).toBeVisible();
  });

  it('copies the value and takes the copied name', async () => {
    await render(<CopyButton value="payload" copiedLabel="Copied!" />);

    await userEvent.click(page.getByRole('button', { name: 'Copy' }));

    await expect.element(page.getByRole('button', { name: 'Copied!' })).toBeVisible();
    expect(await pasted()).toBe('payload');
  });

  it('calls a caller onClick and still copies', async () => {
    const onClick = vi.fn();
    await render(<CopyButton value="after the caller" onClick={onClick} />);

    await userEvent.click(page.getByRole('button', { name: 'Copy' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await expect.element(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await pasted()).toBe('after the caller');
  });

  it("still runs a caller's pointer and focus handlers", async () => {
    const handlers = { onMouseEnter: vi.fn(), onMouseLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn() };
    await render(<CopyButton value="payload" {...handlers} />);
    const button = page.getByRole('button', { name: 'Copy' });

    await userEvent.hover(button);
    await userEvent.unhover(button);
    await userEvent.tab();
    await userEvent.tab();

    for (const handler of Object.values(handlers)) expect(handler).toHaveBeenCalledTimes(1);
  });

  it('skips the copy when a caller onClick prevents the default', async () => {
    await render(<CopyButton value="never copied" onClick={(event) => event.preventDefault()} />);

    await userEvent.click(page.getByRole('button', { name: 'Copy' }));

    await expect.element(page.getByRole('button', { name: 'Copy' })).toBeVisible();
    expect(await pasted()).not.toBe('never copied');
  });
});
