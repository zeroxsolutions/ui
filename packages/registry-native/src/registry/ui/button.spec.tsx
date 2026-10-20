import { render, screen, userEvent } from '@testing-library/react-native';
import { Button, buttonTextVariants } from './button';
import { Text } from './text';

describe('Button', () => {
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

  it('hands its Text the text classes of its variant', async () => {
    await render(
      <Button variant="outline">
        <Text>Save</Text>
      </Button>,
    );

    const classes = screen.getByText('Save').props.className.split(' ');

    expect(classes).toEqual(expect.arrayContaining(buttonTextVariants({ variant: 'outline' }).split(' ')));
  });
});
