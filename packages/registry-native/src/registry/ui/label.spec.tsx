import { render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Label } from './label';

describe('Label', () => {
  it("draws its text in Vega's label type", async () => {
    await render(<Label>Email</Label>);

    expect(emittedClasses(screen.getByText('Email').props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'leading-none', 'font-sans-medium']),
    );
  });

  it("gives its text the nativeID an input's aria-labelledby names", async () => {
    await render(<Label nativeID="email-label">Email</Label>);

    expect(screen.getByText('Email').props.nativeID).toBe('email-label');
  });

  it('runs onPress when pressed, for the caller to focus its field', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Label onPress={onPress}>Email</Label>);

    await user.press(screen.getByText('Email'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('dims itself when disabled', async () => {
    await render(
      <Label disabled testID="label">
        Email
      </Label>,
    );

    expect(emittedClasses(screen.getByTestId('label').props.className)).toContain('opacity-50');
  });

  it('is not dimmed when enabled', async () => {
    await render(<Label testID="label">Email</Label>);

    expect(emittedClasses(screen.getByTestId('label').props.className)).not.toContain('opacity-50');
  });
});
