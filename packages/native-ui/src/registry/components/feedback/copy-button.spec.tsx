import { act, render, screen, userEvent } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { AccessibilityInfo, Platform } from 'react-native';
import { registerCSS } from 'react-native-css-interop/test';
import { CheckIcon } from '../../icons/check-icon';
import { focus, handleOf } from '../../icons/animated-icon.testing';
import { CopyIcon } from '../../icons/copy-icon';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { CopyButton } from './copy-button';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('../../icons/copy-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('copy-icon'),
);
jest.mock('../../icons/check-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('check-icon'),
);

const copyIcon = handleOf(CopyIcon);
const checkIcon = handleOf(CheckIcon);

const setStringAsync = jest.mocked(Clipboard.setStringAsync);
const COMMAND = 'pnpm add @zeroxsolutions/icons';

/** The colour the specs give a ghost Button's text, and so its icons. */
const GHOST_TEXT = '#737373';

/** The stroke of every svg in `tree`, in the order they are drawn. */
function svgStrokes(tree: ReturnType<typeof screen.toJSON>): unknown[] {
  if (tree === null) return [];
  if (Array.isArray(tree)) return tree.flatMap(svgStrokes);
  const own = tree.type === 'RNSVGSvgView' ? [tree.props.stroke] : [];
  return [...own, ...(tree.children ?? []).flatMap((child) => (typeof child === 'string' ? [] : svgStrokes(child)))];
}

let announce: jest.SpyInstance;
const platform = Platform.OS;

beforeEach(() => {
  setStringAsync.mockReset().mockResolvedValue(true);
  for (const handle of [copyIcon, checkIcon]) {
    handle.startAnimation.mockClear();
    handle.stopAnimation.mockClear();
  }
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

  it('starts its icon on press-in and on focus', async () => {
    const onPressIn = jest.fn();
    const onFocus = jest.fn();
    setStringAsync.mockReturnValue(new Promise(() => undefined));
    await render(<CopyButton value={COMMAND} onPressIn={onPressIn} onFocus={onFocus} />);
    const control = screen.getByRole('button', { name: 'Copy' });

    await userEvent.setup().press(control);
    expect(copyIcon.startAnimation).toHaveBeenCalledTimes(1);

    await focus(control);
    await act(() => control.props.onBlur({ nativeEvent: {} }));

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(copyIcon.startAnimation).toHaveBeenCalledTimes(2);
    expect(copyIcon.stopAnimation).not.toHaveBeenCalled();
    // The caller's own handler runs before the icon starts.
    const [pressStart, focusStart] = copyIcon.startAnimation.mock.invocationCallOrder;
    expect(onPressIn.mock.invocationCallOrder[0]).toBeLessThan(pressStart ?? 0);
    expect(onFocus.mock.invocationCallOrder[0]).toBeLessThan(focusStart ?? 0);
  });

  it('plays the check icon once when the copy succeeds', async () => {
    await render(<CopyButton value={COMMAND} />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copied' })).toBeOnTheScreen();
    expect(checkIcon.startAnimation).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the state flips back before the motion ends', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<CopyButton value={COMMAND} timeout={100} />);

    await user.press(screen.getByRole('button', { name: 'Copy' }));
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByRole('button', { name: 'Copy' })).toBeOnTheScreen();
    expect(checkIcon.startAnimation).toHaveBeenCalledTimes(1);
    expect(copyIcon.startAnimation).toHaveBeenCalledTimes(1);
  });

  it('draws its icon in the disabled colour', async () => {
    registerCSS(`.cn-button-variant-ghost\\/text { color: ${GHOST_TEXT}; }`);
    await render(
      <>
        <CopyButton value={COMMAND} disabled />
        <Button variant="ghost" size="icon-xs" disabled>
          <Icon as={Copy} />
        </Button>
      </>,
    );

    const [animated, still] = svgStrokes(screen.toJSON());
    expect(still).toBe(GHOST_TEXT);
    expect(animated).toBe(still);
  });
});
