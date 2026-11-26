import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { InputGroupAddon, InputGroupText } from '@/registry/bases/base-ui/ui/input-group';

import { NumberField, NumberFieldInput, type NumberFieldInputProps, type NumberFieldProps } from './number-field';

function renderField(props: Omit<NumberFieldProps, 'children'>, input: NumberFieldInputProps = {}) {
  return render(
    <NumberField {...props}>
      <InputGroupAddon>
        <InputGroupText>W</InputGroupText>
      </InputGroupAddon>
      <NumberFieldInput {...input} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>px</InputGroupText>
      </InputGroupAddon>
    </NumberField>,
  );
}

const input = () => page.getByRole('textbox');

/** Types `text` over the field's draft and leaves the field, which commits the draft. */
async function enter(text: string): Promise<void> {
  await userEvent.fill(input(), text);
  await userEvent.tab();
}

describe('NumberField', () => {
  it('evaluates an arithmetic expression and commits the result via onValueChange', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 100, onValueChange });

    await enter('100 + 8');
    expect(onValueChange).toHaveBeenCalledWith(108);
  });

  it('clamps the committed value to min/max', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 5, min: 0, max: 10, onValueChange });

    await enter('50');
    expect(onValueChange).toHaveBeenCalledWith(10);
  });

  it('blanks the value and shows the consumer placeholder while mixed', async () => {
    await renderField({ value: 5, mixed: true, onValueChange: () => {} }, { placeholder: 'Mixed' });

    await expect.element(input()).toHaveValue('');
    await expect.element(input()).toHaveAttribute('placeholder', 'Mixed');
  });

  it('honours a custom parseRaw over the arithmetic evaluator', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 0, parseRaw: () => 7, onValueChange });

    await enter('anything');
    expect(onValueChange).toHaveBeenCalledWith(7);
  });

  it('steps the value on ArrowUp/ArrowDown when step is set, from the draft being edited (clamped)', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 5, step: 2, max: 6, onValueChange });

    await userEvent.click(input());
    await userEvent.keyboard('{ArrowUp}');
    // 5 + 2 = 7, clamped to max 6, and the draft reads 6.
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    await expect.element(input()).toHaveValue('6');
    await userEvent.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenLastCalledWith(4);
  });

  it('leaves the arrows inert when no step is given', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 5, onValueChange });

    await userEvent.click(input());
    await userEvent.keyboard('{ArrowUp}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('shows displayText until focused, then the number to edit', async () => {
    await renderField({ value: 5, displayText: 'Hug', onValueChange: () => {} });

    await expect.element(input()).toHaveValue('Hug');
    await userEvent.click(input());
    await expect.element(input()).toHaveValue('');
  });

  it('places the addons the consumer composed around the input', async () => {
    await renderField({ value: 5, onValueChange: () => {} });

    await expect.element(page.getByTestId('number-field')).toHaveTextContent('Wpx');
    expect(page.getByTestId('number-field').element().contains(input().element())).toBe(true);
  });

  it('carries data-editing only while the input is focused', async () => {
    await renderField({ value: 5, onValueChange: () => {} });
    const root = page.getByTestId('number-field');

    await expect.element(root).not.toHaveAttribute('data-editing');
    await userEvent.click(input());
    await expect.element(root).toHaveAttribute('data-editing');
    await userEvent.tab();
    await expect.element(root).not.toHaveAttribute('data-editing');
  });

  it('runs the consumer handlers on the input beside its own', async () => {
    const onValueChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    await renderField({ value: 1, onValueChange }, { onFocus, onBlur });

    await enter('2');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(2);
  });

  it('drops the draft on Escape and commits nothing', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 5, onValueChange });

    await userEvent.fill(input(), '42');
    await userEvent.keyboard('{Escape}');

    expect(onValueChange).not.toHaveBeenCalled();
    await expect.element(input()).toHaveValue('5');
    await expect.element(input()).not.toHaveFocus();
  });

  it('commits the next edit after an Escape', async () => {
    const onValueChange = vi.fn();
    await renderField({ value: 5, onValueChange });

    await userEvent.fill(input(), '42');
    await userEvent.keyboard('{Escape}');
    await enter('9');

    expect(onValueChange.mock.calls).toEqual([[9]]);
  });
});

describe('NumberFieldInput honors a caller preventDefault', () => {
  it("skips stepping the value when a caller's onKeyDown prevents the default, but still runs", async () => {
    const onValueChange = vi.fn();
    const onKeyDown = vi.fn();
    await renderField(
      { value: 5, step: 2, onValueChange },
      {
        onKeyDown: (event) => {
          onKeyDown(event.key);
          event.preventDefault();
        },
      },
    );

    await userEvent.click(input());
    await userEvent.keyboard('{ArrowUp}');

    expect(onKeyDown).toHaveBeenCalledWith('ArrowUp');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
