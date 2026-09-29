import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InputGroupAddon, InputGroupText } from '@/registry/bases/base-ui/ui/input-group';

import { NumberField, NumberFieldInput, type NumberFieldInputProps, type NumberFieldProps } from './number-field';

afterEach(cleanup);

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

function root(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="number-field"]')!;
}

describe('NumberField', () => {
  it('evaluates an arithmetic expression and commits the result via onValueChange', () => {
    const onValueChange = vi.fn();
    renderField({ value: 100, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '100 + 8' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(108);
  });

  it('clamps the committed value to min/max', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, min: 0, max: 10, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '50' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(10);
  });

  it('blanks the value and shows the consumer placeholder while mixed', () => {
    renderField({ value: 5, mixed: true, onValueChange: () => {} }, { placeholder: 'Mixed' });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Mixed');
  });

  it('honours a custom parseRaw over the arithmetic evaluator', () => {
    const onValueChange = vi.fn();
    renderField({ value: 0, parseRaw: () => 7, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'anything' } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith(7);
  });

  it('steps the value on ArrowUp/ArrowDown when step is set (clamped)', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, step: 2, max: 6, onValueChange });

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    // 5 + 2 = 7, clamped to max 6.
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onValueChange).toHaveBeenLastCalledWith(3);
  });

  it('leaves the arrows inert when no step is given', () => {
    const onValueChange = vi.fn();
    renderField({ value: 5, onValueChange });

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('shows displayText until focused, then the number to edit', () => {
    renderField({ value: 5, displayText: 'Hug', onValueChange: () => {} });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Hug');
    fireEvent.focus(input);
    expect(input.value).toBe('');
  });

  it('places the addons the consumer composed around the input', () => {
    renderField({ value: 5, onValueChange: () => {} });

    expect(root().textContent).toBe('Wpx');
    expect(root().querySelector('input')).toBe(screen.getByRole('textbox'));
  });

  it('carries data-mixed while mixed and data-editing while the input is focused', () => {
    renderField({ value: 5, mixed: true, onValueChange: () => {} });

    expect(root().hasAttribute('data-mixed')).toBe(true);
    expect(root().hasAttribute('data-editing')).toBe(false);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(root().hasAttribute('data-editing')).toBe(true);
    fireEvent.blur(input);
    expect(root().hasAttribute('data-editing')).toBe(false);
  });

  it('runs the consumer handlers on the input beside its own', () => {
    const onValueChange = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    renderField({ value: 1, onValueChange }, { onFocus, onBlur });

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(2);
  });
});
