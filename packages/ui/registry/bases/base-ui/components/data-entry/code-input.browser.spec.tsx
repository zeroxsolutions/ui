import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import '../../../../../test/nova-style.css';

import { CodeInput } from './code-input';

/** Draws `code` in a style, whose slots give the code's one real input the size a reader presses on. */
function inStyle(code: ReactNode) {
  return render(<div className="style-nova">{code}</div>);
}

const groups = () => page.getByTestId('input-otp-group').elements();
const slotTexts = () =>
  page
    .getByTestId('code-input-slot')
    .elements()
    .map((slot) => slot.textContent);
const input = () => page.getByRole('textbox', { name: 'Verification code' });

/** Copies the whole text of the field named `label`, as a reader copies a code out of a message. */
async function copyFrom(label: string): Promise<void> {
  await userEvent.tripleClick(page.getByLabelText(label));
  await userEvent.copy();
}

describe('CodeInput', () => {
  it('renders one group of six slots and one input for the pattern "6"', async () => {
    await inStyle(<CodeInput aria-label="Verification code" />);

    await expect.element(input()).toBeInTheDocument();
    expect(groups()).toHaveLength(1);
    expect(groups()[0]?.querySelectorAll('[data-slot=code-input-slot]')).toHaveLength(6);
    expect(page.getByTestId('input-otp-separator').elements()).toHaveLength(0);
    expect(page.getByRole('textbox').elements()).toHaveLength(1);
  });

  it('renders two groups of three with a separator and one input for the pattern "3-3"', async () => {
    await inStyle(<CodeInput aria-label="Verification code" pattern="3-3" />);

    await expect.element(input()).toBeInTheDocument();
    expect(groups().map((group) => group.querySelectorAll('[data-slot=code-input-slot]').length)).toEqual([3, 3]);
    expect(page.getByTestId('input-otp-separator').elements()).toHaveLength(1);
    expect(page.getByRole('textbox').elements()).toHaveLength(1);
  });

  it('keeps the separator between the groups out of what a screen reader reads', async () => {
    await inStyle(<CodeInput aria-label="Verification code" pattern="3-3" />);

    await expect.element(input()).toBeInTheDocument();
    expect(page.getByRole('separator').elements()).toEqual([]);
  });

  it('fills the slots left to right as the code is typed', async () => {
    const onChange = vi.fn();
    await inStyle(<CodeInput aria-label="Verification code" onChange={onChange} />);

    await userEvent.type(input(), '12');

    await expect.poll(slotTexts).toEqual(['1', '2', '', '', '', '']);
    expect(onChange).toHaveBeenLastCalledWith('12');
  });

  it('fills every slot when the whole code arrives at once', async () => {
    await inStyle(<CodeInput aria-label="Verification code" pattern="3-3" />);

    await userEvent.fill(input(), '482913');

    await expect.poll(slotTexts).toEqual(['4', '8', '2', '9', '1', '3']);
  });

  it('fills every slot from one paste of the whole code', async () => {
    const onChange = vi.fn();
    await inStyle(
      <>
        <input aria-label="Message" defaultValue="482913" />
        <CodeInput aria-label="Verification code" pattern="3-3" onChange={onChange} />
      </>,
    );
    await copyFrom('Message');

    await userEvent.click(input());
    await userEvent.paste();

    await expect.poll(slotTexts).toEqual(['4', '8', '2', '9', '1', '3']);
    expect(onChange).toHaveBeenLastCalledWith('482913');
  });

  it('refuses a pasted code holding a character outside the code', async () => {
    await inStyle(
      <>
        <input aria-label="Message" defaultValue="48a913" />
        <CodeInput aria-label="Verification code" />
      </>,
    );
    await copyFrom('Message');

    await userEvent.click(input());
    await userEvent.paste();

    await expect.element(input()).toHaveValue('');
    expect(slotTexts()).toEqual(['', '', '', '', '', '']);
  });

  it('refuses a character outside the code', async () => {
    await inStyle(<CodeInput aria-label="Verification code" />);

    await userEvent.type(input(), 'a');

    await expect.element(input()).toHaveValue('');
    expect(slotTexts()).toEqual(['', '', '', '', '', '']);
  });

  it('marks the input invalid when the code is', async () => {
    await inStyle(<CodeInput aria-label="Verification code" aria-invalid />);

    await expect.element(input()).toHaveAttribute('aria-invalid', 'true');
  });
});
