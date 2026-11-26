import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from './button';
import { Text } from './text';

describe('Button', () => {
  it("merges a caller's accessibility state with disabled, and keeps the caller's disabled when none is given", async () => {
    await render(
      <>
        <Button accessibilityState={{ busy: true }} disabled aria-label="Both" />
        <Button accessibilityState={{ disabled: true }} aria-label="Caller" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Both' }).props.accessibilityState).toEqual(
      expect.objectContaining({ busy: true, disabled: true }),
    );
    expect(screen.getByRole('button', { name: 'Caller' }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('is a button that runs onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces disabled and does not run onPress when disabled', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Button disabled onPress={onPress}>
        <Text>Save</Text>
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });

    await user.press(button);

    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button handlers', () => {
  it('forwards onPressIn to a caller', async () => {
    const onPressIn = jest.fn();
    await render(<Button aria-label="Copy" onPressIn={onPressIn} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Copy' }));

    expect(onPressIn).toHaveBeenCalledTimes(1);
  });
});
