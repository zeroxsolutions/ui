import { render, screen, userEvent } from '@testing-library/react-native';
import { GitBranch } from 'lucide-react-native';
import { AccessibilityInfo, Platform, Pressable } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Icon } from './icon';
import { Marker, MarkerContent, MarkerIcon } from './marker';
import { Spinner } from './spinner';
import { Text } from './text';

function classesOf(className: string | undefined): string[] {
  return emittedClasses(className);
}

/** The classes of each element the marker draws straight inside it, in order. */
function childClasses(testID: string): string[][] {
  return screen
    .getByTestId(testID)
    .children.flatMap((child) => (typeof child === 'string' ? [] : [classesOf(child.props.className)]));
}

describe('Marker', () => {
  it('draws its text small and muted in a row with its icon', async () => {
    await render(
      <Marker testID="marker">
        <MarkerIcon>
          <Icon as={GitBranch} />
        </MarkerIcon>
        <MarkerContent>Switched to a new branch</MarkerContent>
      </Marker>,
    );

    expect(classesOf(screen.getByTestId('marker').props.className)).toEqual(
      expect.arrayContaining(['flex-row', 'items-center', 'gap-2']),
    );
    expect(classesOf(screen.getByText('Switched to a new branch').props.className)).toEqual(
      expect.arrayContaining(['text-sm', 'text-muted-foreground']),
    );
  });

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

  it('draws a line either side of the text of a separator, the text not growing', async () => {
    await render(
      <Marker variant="separator" testID="marker">
        <MarkerContent>Conversation compacted</MarkerContent>
      </Marker>,
    );

    const [before, content, after] = childClasses('marker');
    expect(before).toEqual(expect.arrayContaining(['h-px', 'flex-1', 'bg-border', 'mr-1']));
    expect(after).toEqual(expect.arrayContaining(['h-px', 'flex-1', 'bg-border', 'ml-1']));
    expect(content).toEqual(expect.arrayContaining(['flex-none', 'text-center']));
  });

  it('draws no lines for the default marker', async () => {
    await render(
      <Marker testID="marker">
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>,
    );

    expect(childClasses('marker')).toHaveLength(1);
  });

  it('rules a border under a border marker', async () => {
    await render(
      <Marker variant="border" testID="marker">
        <MarkerContent>Plan</MarkerContent>
      </Marker>,
    );

    expect(classesOf(screen.getByTestId('marker').props.className)).toEqual(
      expect.arrayContaining(['border-b', 'border-border', 'pb-2']),
    );
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

  it('announces the text of a status marker on iOS as it appears and changes, nested text included', async () => {
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

      expect(announce.mock.calls).toEqual([['Thinking...'], ['Oliver is typing...']]);
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

  it('renders its child in its place with asChild, keeping the lines of a separator inside it', async () => {
    const onPress = jest.fn();
    await render(
      <Marker asChild variant="separator">
        <Pressable role="button" testID="marker" onPress={onPress}>
          <MarkerContent>
            <Text>Show earlier messages</Text>
          </MarkerContent>
        </Pressable>
      </Marker>,
    );

    await userEvent.setup().press(screen.getByRole('button', { name: 'Show earlier messages' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(childClasses('marker')).toHaveLength(3);
  });
});
