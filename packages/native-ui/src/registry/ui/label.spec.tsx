import { render, screen, userEvent } from '@testing-library/react-native';
import { Label } from './label';

describe('Label', () => {
  it('runs onPress when pressed, for the caller to focus its field', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Label onPress={onPress}>Email</Label>);

    await user.press(screen.getByText('Email'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
