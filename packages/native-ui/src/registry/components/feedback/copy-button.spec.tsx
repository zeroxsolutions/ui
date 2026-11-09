import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { AccessibilityInfo, Platform } from 'react-native';
import { CopyButton } from './copy-button';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const setStringAsync = jest.mocked(Clipboard.setStringAsync);
const COMMAND = 'pnpm add @zeroxsolutions/icons';

let announce: jest.SpyInstance;
const platform = Platform.OS;

beforeEach(() => {
  setStringAsync.mockReset().mockResolvedValue(true);
  announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
});

afterEach(() => {
  announce.mockRestore();
  Platform.OS = platform;
  jest.useRealTimers();
});

describe('CopyButton', () => {
  it('is a button named Copy', async () => {
    await render(<CopyButton value={COMMAND} />);

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
  });

  it('copies its value, takes the name Copied, and tells the caller', async () => {
    const user = userEvent.setup();
    const onCopied = jest.fn();
    await render(<CopyButton value={COMMAND} onCopied={onCopied} />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));

    expect(setStringAsync).toHaveBeenCalledWith(COMMAND);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();
    expect(onCopied).toHaveBeenCalledWith(COMMAND);
  });

  it('announces the copy on iOS, and through a live region elsewhere', async () => {
    Platform.OS = 'ios';
    const user = userEvent.setup();
    await render(<CopyButton value={COMMAND} copiedLabel="Command copied" />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));

    expect(announce).toHaveBeenCalledWith('Command copied');
    expect(screen.getByText('Command copied')).toBeOnTheScreen();
  });

  it('goes back to Copy after its timeout', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<CopyButton value={COMMAND} timeout={500} />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));
    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
  });

  it('stays Copy and announces nothing when the clipboard refuses the write', async () => {
    setStringAsync.mockRejectedValue(new Error('denied'));
    const user = userEvent.setup();
    const onCopied = jest.fn();
    await render(<CopyButton value={COMMAND} onCopied={onCopied} />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
    expect(announce).not.toHaveBeenCalled();
    expect(onCopied).not.toHaveBeenCalled();
  });

  it('runs a caller onPress and still copies when it lets the default stand', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<CopyButton value={COMMAND} onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(setStringAsync).toHaveBeenCalledWith(COMMAND);
  });
});
