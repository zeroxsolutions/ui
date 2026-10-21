import { fireEvent, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Input } from './input.nativewind';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

describe('Input', () => {
  it("draws Vega's field: a 36px rounded box in the input border colour", async () => {
    await render(<Input testID="field" />);

    expect(classesOf('field')).toEqual(
      expect.arrayContaining(['h-9', 'rounded-md', 'border', 'border-input', 'text-base', 'text-foreground']),
    );
    expect(classesOf('field')).not.toContain('border-ring');
  });

  it('takes the focus border while it holds focus and gives it back on blur', async () => {
    await render(<Input testID="field" />);

    await fireEvent(screen.getByTestId('field'), 'focus');
    expect(classesOf('field')).toContain('border-ring');

    await fireEvent(screen.getByTestId('field'), 'blur');
    expect(classesOf('field')).not.toContain('border-ring');
  });

  it("still calls the caller's onFocus and onBlur", async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(<Input testID="field" onFocus={onFocus} onBlur={onBlur} />);

    await fireEvent(screen.getByTestId('field'), 'focus');
    await fireEvent(screen.getByTestId('field'), 'blur');

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('draws the destructive border and passes aria-invalid on to the field', async () => {
    await render(<Input testID="field" aria-invalid />);

    expect(classesOf('field')).toContain('border-destructive');
    expect(screen.getByTestId('field').props['aria-invalid']).toBe(true);
  });

  it('keeps the destructive border while focused', async () => {
    await render(<Input testID="field" aria-invalid />);

    await fireEvent(screen.getByTestId('field'), 'focus');

    expect(classesOf('field')).toContain('border-destructive');
    expect(classesOf('field')).not.toContain('border-ring');
  });

  it('is not editable, dimmed and announced disabled when editable is false', async () => {
    await render(<Input testID="field" editable={false} />);
    const field = screen.getByTestId('field');

    expect(field.props.editable).toBe(false);
    expect(field.props['aria-disabled']).toBe(true);
    expect(classesOf('field')).toContain('opacity-50');
  });

  it('is editable and undimmed by default', async () => {
    await render(<Input testID="field" />);

    expect(classesOf('field')).not.toContain('opacity-50');
    expect(screen.getByTestId('field').props.editable).not.toBe(false);
  });

  it("draws its placeholder in NativeWind's placeholder variant, in the muted colour", async () => {
    await render(<Input testID="field" placeholder="Email" />);

    expect(classesOf('field')).toContain('placeholder:text-muted-foreground');
    expect(screen.getByPlaceholderText('Email')).toBe(screen.getByTestId('field'));
  });

  it('takes its name from the label that points at it', async () => {
    await render(<Input aria-labelledby="email-label" testID="field" />);

    expect(screen.getByTestId('field').props['aria-labelledby']).toBe('email-label');
  });

  it('lets a caller class win over the recipe', async () => {
    await render(<Input testID="field" className="h-12" />);

    expect(classesOf('field')).toContain('h-12');
    expect(classesOf('field')).not.toContain('h-9');
  });

  it("tints Nova's read-only field in the input colour, light and dark, and leaves an editable one clear", async () => {
    await render(<Input testID="read-only" editable={false} />);
    const readOnly = emittedClasses(screen.getByTestId('read-only').props.className, 'nova');

    expect(readOnly).toEqual(expect.arrayContaining(['bg-input/50', 'dark:bg-input/80']));
    expect(readOnly.filter((cls) => cls.includes('disabled:'))).toEqual([]);

    await render(<Input testID="editable" />);
    expect(emittedClasses(screen.getByTestId('editable').props.className, 'nova')).not.toContain('bg-input/50');
  });
});
