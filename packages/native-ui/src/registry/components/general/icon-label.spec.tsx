import { render, screen, userEvent } from '@testing-library/react-native';
import { useContext, type ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { IconClassContext } from '../../ui/icon';
import { TextClassContext } from '../../ui/text';
import { IconLabel } from './icon-label';

/** Writes the text and icon classes an Icon inside the label takes, so a spec reads them. */
function Probe(): ReactNode {
  const text = useContext(TextClassContext);
  const icon = useContext(IconClassContext);
  return <NativeText testID="probe">{`${text ?? ''}|${icon ?? ''}`}</NativeText>;
}

describe('IconLabel', () => {
  it('is read as the words its icon stands in for', async () => {
    await render(
      <IconLabel aria-label="Rotation">
        <Probe />
      </IconLabel>,
    );

    expect(screen.getByLabelText('Rotation')).toBeOnTheScreen();
  });

  it('carries the nativeID an input names in aria-labelledby', async () => {
    await render(
      <IconLabel aria-label="Rotation" nativeID="rotation" testID="label">
        <Probe />
      </IconLabel>,
    );

    expect(screen.getByTestId('label').props.nativeID).toBe('rotation');
  });

  it('runs onPress when pressed, which the caller points at the input', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <IconLabel aria-label="Rotation" onPress={onPress}>
        <Probe />
      </IconLabel>,
    );

    await user.press(screen.getByLabelText('Rotation'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws its icon at size-3 in the muted foreground, in a row', async () => {
    await render(
      <IconLabel aria-label="Rotation" testID="label">
        <Probe />
      </IconLabel>,
    );

    expect(String(screen.getByTestId('probe').props.children)).toBe('text-muted-foreground|size-3');
    expect(emittedClasses(screen.getByTestId('label').props.className)).toEqual(
      expect.arrayContaining(['flex-row', 'items-center']),
    );
  });
});
