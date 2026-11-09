import { render, screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { IconLabel } from './icon-label';

describe('IconLabel', () => {
  it('is read as the words its icon stands in for', async () => {
    await render(
      <IconLabel aria-label="Rotation">
        <Text>R</Text>
      </IconLabel>,
    );

    expect(screen.getByLabelText('Rotation')).toBeOnTheScreen();
  });

  it('carries the nativeID an input names in aria-labelledby', async () => {
    await render(
      <IconLabel aria-label="Rotation" nativeID="rotation" testID="label">
        <Text>R</Text>
      </IconLabel>,
    );

    expect(screen.getByTestId('label').props.nativeID).toBe('rotation');
  });

  it('runs onPress when pressed, which the caller points at the input', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <IconLabel aria-label="Rotation" onPress={onPress}>
        <Text>R</Text>
      </IconLabel>,
    );

    await user.press(screen.getByLabelText('Rotation'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
