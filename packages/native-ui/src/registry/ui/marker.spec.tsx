import { render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Platform, Pressable } from 'react-native';
import { Marker, MarkerContent, MarkerIcon } from './marker';
import { Spinner } from './spinner';
import { Text } from './text';

describe('Marker', () => {
  it('hides its icon from screen readers', async () => {
    await render(
      <Marker>
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent>Thinking...</MarkerContent>
      </Marker>,
    );

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('progressbar', { includeHiddenElements: true })).toBeTruthy();
  });

  it('is a polite live region while it is a status, which TalkBack reads as it changes', async () => {
    await render(
      <Marker role="status" testID="marker">
        <MarkerContent>Thinking...</MarkerContent>
      </Marker>,
    );

    const marker = screen.getByTestId('marker');
    expect(marker.props.role).toBe('status');
    expect(marker.props['aria-live']).toBe('polite');
  });

  it('announces the text of a status marker on iOS as it changes, not as it appears, nested text included', async () => {
    const os = Platform.OS;
    Platform.OS = 'ios';
    // React Native's jest setup makes announceForAccessibility one shared mock, so its calls carry over between tests.
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
    try {
      const { rerender } = await render(
        <Marker role="status">
          <MarkerContent>Thinking...</MarkerContent>
        </Marker>,
      );
      await rerender(
        <Marker role="status">
          <MarkerContent>Thinking...</MarkerContent>
        </Marker>,
      );
      await rerender(
        <Marker role="status">
          <MarkerContent>
            <Text>Oliver</Text> is typing...
          </MarkerContent>
        </Marker>,
      );

      expect(announce.mock.calls).toEqual([['Oliver is typing...']]);
    } finally {
      Platform.OS = os;
    }
  });

  it('announces nothing for a marker that is not a status', async () => {
    const os = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
    try {
      await render(
        <Marker>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>,
      );

      expect(announce).not.toHaveBeenCalled();
    } finally {
      Platform.OS = os;
    }
  });

  it('renders its child in its place with asChild, so the whole marker takes a press', async () => {
    const onPress = jest.fn();
    await render(
      <Marker asChild variant="separator" testID="marker">
        <Pressable role="button" onPress={onPress}>
          <MarkerContent>
            <Text>Show earlier messages</Text>
          </MarkerContent>
        </Pressable>
      </Marker>,
    );

    const marker = screen.getByRole('button', { name: 'Show earlier messages' });
    await userEvent.setup().press(marker);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('marker')).toBe(marker);
  });
});
