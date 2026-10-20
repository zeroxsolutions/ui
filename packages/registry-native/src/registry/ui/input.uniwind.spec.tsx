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
});
