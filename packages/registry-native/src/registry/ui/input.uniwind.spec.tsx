import { fireEvent, render, screen } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Input } from './input.uniwind';

describe('Input on Uniwind', () => {
  it("colours its placeholder through Uniwind's placeholderTextColorClassName", async () => {
    await render(<Input testID="field" placeholder="Email" />);
    const field = screen.getByTestId('field');

    expect(field.props.placeholderTextColorClassName).toBe('accent-muted-foreground');
    expect(emittedClasses(field.props.className)).not.toContain('placeholder:text-muted-foreground');
  });

  it("takes Vega's focus, invalid and disabled states as on NativeWind", async () => {
    await render(<Input testID="field" aria-invalid editable={false} />);
    expect(emittedClasses(screen.getByTestId('field').props.className)).toEqual(
      expect.arrayContaining(['border-destructive', 'opacity-50']),
    );

    await render(<Input testID="plain" />);
    await fireEvent(screen.getByTestId('plain'), 'focus');
    expect(emittedClasses(screen.getByTestId('plain').props.className)).toContain('border-ring');
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
