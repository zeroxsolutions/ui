import { fireEvent, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Textarea } from './textarea.nativewind';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

describe('Textarea', () => {
  it('is a multiline field 64px tall at least', async () => {
    await render(<Textarea testID="field" />);

    expect(screen.getByTestId('field').props.multiline).toBe(true);
    expect(classesOf('field')).toEqual(
      expect.arrayContaining(['min-h-16', 'rounded-md', 'border', 'border-input', 'text-base']),
    );
    expect(classesOf('field')).not.toContain('h-9');
  });

  it('starts its text at the top', async () => {
    await render(<Textarea testID="field" />);

    expect(screen.getByTestId('field').props.textAlignVertical).toBe('top');
  });

  it('takes the focus border while it holds focus', async () => {
    await render(<Textarea testID="field" />);

    await fireEvent(screen.getByTestId('field'), 'focus');
    expect(classesOf('field')).toContain('border-ring');

    await fireEvent(screen.getByTestId('field'), 'blur');
    expect(classesOf('field')).not.toContain('border-ring');
  });

  it('draws the destructive border and passes aria-invalid on to the field', async () => {
    await render(<Textarea testID="field" aria-invalid />);

    expect(classesOf('field')).toContain('border-destructive');
    expect(screen.getByTestId('field').props['aria-invalid']).toBe(true);
  });

  it('is not editable and dimmed when editable is false', async () => {
    await render(<Textarea testID="field" editable={false} />);

    expect(screen.getByTestId('field').props.editable).toBe(false);
    expect(classesOf('field')).toContain('opacity-50');
  });

  it("draws its placeholder in NativeWind's placeholder variant", async () => {
    await render(<Textarea testID="field" />);

    expect(classesOf('field')).toContain('placeholder:text-muted-foreground');
  });
});
