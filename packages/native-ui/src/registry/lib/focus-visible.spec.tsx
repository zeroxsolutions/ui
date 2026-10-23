import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { useFocusVisible } from './focus-visible';

function Control(): ReactNode {
  const { focusVisible, onFocus, onBlur } = useFocusVisible();
  return (
    <Pressable role="button" onFocus={onFocus} onBlur={onBlur}>
      <Text>{focusVisible ? 'ringed' : 'plain'}</Text>
    </Pressable>
  );
}

/** A focus event whose target answers `:focus-visible` with `visible`, as a browser's does. */
function focusFrom(visible: boolean): object {
  return { target: { matches: (selector: string) => selector === ':focus-visible' && visible } };
}

describe('useFocusVisible', () => {
  const os = Platform.OS;

  afterEach(() => {
    Platform.OS = os;
  });

  describe('on the web', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('is on while focus came from the keyboard, as the browser says, and off once it leaves', async () => {
      await render(<Control />);
      const button = screen.getByRole('button');

      await fireEvent(button, 'focus', focusFrom(true));
      expect(screen.getByText('ringed')).toBeOnTheScreen();

      await fireEvent(button, 'blur');
      expect(screen.getByText('plain')).toBeOnTheScreen();
    });

    it('stays off when a pointer press focused the control, and on for the keyboard focus after it', async () => {
      await render(<Control />);
      const button = screen.getByRole('button');

      await fireEvent(button, 'focus', focusFrom(false));
      await fireEvent(button, 'pressIn');
      await fireEvent(button, 'pressOut');
      expect(screen.getByText('plain')).toBeOnTheScreen();

      await fireEvent(button, 'blur');
      await fireEvent(button, 'focus', focusFrom(true));
      expect(screen.getByText('ringed')).toBeOnTheScreen();
    });
  });

  it('is on for any focus on a device, where only a keyboard moves focus to a control', async () => {
    Platform.OS = 'ios';
    await render(<Control />);

    await fireEvent(screen.getByRole('button'), 'focus', {});

    expect(screen.getByText('ringed')).toBeOnTheScreen();
  });
});
