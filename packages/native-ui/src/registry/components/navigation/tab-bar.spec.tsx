import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { House, Search } from 'lucide-react-native';
import { Platform } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import {
  TabBar,
  TabBarBadge,
  TabBarIcon,
  TabBarIndicator,
  TabBarItem,
  TabBarLabel,
  type TabBarLabels,
  type TabBarShape,
  type TabBarSide,
  type TabBarSurface,
} from './tab-bar';
import { Icon } from '../../ui/icon';

type ExampleProps = {
  side?: TabBarSide;
  labels?: TabBarLabels;
  surface?: TabBarSurface;
  shape?: TabBarShape;
  badge?: string;
  countLabel?: string;
  onPressInbox?: () => void;
};

function Example({ side, labels, surface, shape, badge, countLabel, onPressInbox }: ExampleProps) {
  return (
    <TabBar accessibilityLabel="Main" testID="bar" side={side} labels={labels} surface={surface} shape={shape}>
      <TabBarItem active>
        <TabBarIndicator testID="home-indicator">
          <TabBarIcon>
            <Icon as={House} />
          </TabBarIcon>
        </TabBarIndicator>
        <TabBarLabel>Home</TabBarLabel>
      </TabBarItem>
      <TabBarItem onPress={onPressInbox}>
        <TabBarIndicator testID="inbox-indicator">
          <TabBarIcon>
            <Icon as={Search} />
          </TabBarIcon>
          {badge && (
            <TabBarBadge testID="badge" countLabel={countLabel}>
              {badge}
            </TabBarBadge>
          )}
        </TabBarIndicator>
        <TabBarLabel testID="inbox-label">Inbox</TabBarLabel>
      </TabBarItem>
    </TabBar>
  );
}

function classes(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

const initialPlatform = Platform.OS;

afterEach(() => {
  Platform.OS = initialPlatform;
});

describe('TabBar', () => {
  // React Native gives tablist no iOS trait; tabbar is UIAccessibilityTraitTabBar, under which
  // VoiceOver reads each item as a tab. TalkBack reads tablist.
  it.each([
    ['ios', 'tabbar'],
    ['android', 'tablist'],
  ] as const)(
    'is named by its label and carries the role a screen reader on %s reads as a tab bar',
    async (os, role) => {
      Platform.OS = os;
      await render(<Example />);

      const bar = screen.getByLabelText('Main');
      expect(bar.props.accessibilityRole).toBe(role);
      expect(bar).toBe(screen.getByTestId('bar'));
    },
  );

  it('announces only the active item as selected', async () => {
    await render(<Example />);

    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Inbox' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Inbox' }).props.accessibilityState).toMatchObject({ selected: false });
  });

  it.each([
    ['top', 'flex-row', 'top-0'],
    ['bottom', 'flex-row', 'bottom-0'],
    ['left', 'flex-col', 'left-0'],
    ['right', 'flex-col', 'right-0'],
  ] as const)('lays side %s out as %s at its edge', async (side, direction, edge) => {
    await render(<Example side={side} />);

    expect(classes('bar')).toContain(direction);
    expect(classes('bar')).toContain(edge);
  });

  it('sits at the bottom, translucent and attached by default', async () => {
    await render(<Example />);

    expect(classes('bar')).toEqual(expect.arrayContaining(['flex-row', 'bottom-0', 'bg-background/70']));
    expect(classes('bar')).not.toContain('rounded-full');
  });

  it('switches the surface between translucent and solid', async () => {
    const { rerender } = await render(<Example surface="solid" />);
    expect(classes('bar')).toContain('bg-background');
    expect(classes('bar')).not.toContain('bg-background/70');

    await rerender(<Example surface="translucent" />);
    expect(classes('bar')).toContain('bg-background/70');
  });

  it('draws the floating shape as a pill inset 16px from its edge', async () => {
    await render(<Example shape="floating" />);

    expect(classes('bar')).toEqual(expect.arrayContaining(['rounded-full', 'bottom-4', 'inset-x-4']));
  });

  it.each([
    ['left', 'left-4'],
    ['right', 'right-4'],
  ] as const)('centres a floating bar on the %s edge vertically, 16px in', async (side, edge) => {
    await render(<Example side={side} shape="floating" />);

    expect(classes('bar-wrapper')).toEqual(expect.arrayContaining(['absolute', 'inset-y-0', 'justify-center', edge]));
    expect(screen.getByTestId('bar-wrapper').props.pointerEvents).toBe('box-none');
    expect(classes('bar')).toEqual(expect.arrayContaining(['flex-col', 'rounded-full']));
    expect(classes('bar')).not.toContain('absolute');
  });

  it.each(['top', 'bottom'] as const)('places a floating bar on the %s edge without a wrapper', async (side) => {
    await render(<Example side={side} shape="floating" />);

    expect(screen.queryByTestId('bar-wrapper')).toBeNull();
  });

  it('places an attached bar on the left edge without a wrapper', async () => {
    await render(<Example side="left" />);

    expect(screen.queryByTestId('bar-wrapper')).toBeNull();
  });

  it('throws when a part is rendered outside a TabBar', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<TabBarLabel>Home</TabBarLabel>)).rejects.toThrow('TabBar parts must be used within <TabBar>');
    jest.restoreAllMocks();
  });
});

describe('TabBarLabel', () => {
  it('shows every label for labels "always"', async () => {
    await render(<Example labels="always" />);

    expect(classes('inbox-label')).not.toContain('opacity-0');
    expect(emittedClasses(screen.getByText('Home').props.className)).not.toContain('opacity-0');
  });

  it('shows only the active label for labels "selected", and keeps the others as names', async () => {
    await render(<Example labels="selected" />);

    expect(emittedClasses(screen.getByText('Home').props.className)).not.toContain('opacity-0');
    expect(classes('inbox-label')).toEqual(expect.arrayContaining(['absolute', 'opacity-0']));
    expect(screen.getByRole('tab', { name: 'Inbox' })).toBeOnTheScreen();
  });

  it('shows no label for labels "none", and keeps every item named', async () => {
    await render(<Example labels="none" />);

    expect(emittedClasses(screen.getByText('Home').props.className)).toContain('opacity-0');
    expect(classes('inbox-label')).toContain('opacity-0');
    expect(screen.getByRole('tab', { name: 'Home' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Inbox' })).toBeOnTheScreen();
  });

  it('colours the active label primary and the others muted', async () => {
    await render(<Example />);

    expect(emittedClasses(screen.getByText('Home').props.className)).toContain('text-primary');
    expect(classes('inbox-label')).toContain('text-muted-foreground');
  });
});

describe('TabBarItem', () => {
  it("keeps a caller's accessibilityState beside the selected state it announces", async () => {
    await render(
      <TabBar accessibilityLabel="Main">
        <TabBarItem active accessibilityState={{ disabled: true }}>
          <TabBarLabel>Home</TabBarLabel>
        </TabBarItem>
      </TabBar>,
    );

    expect(screen.getByRole('tab', { name: 'Home' }).props.accessibilityState).toMatchObject({
      selected: true,
      disabled: true,
    });
  });

  it("keeps a caller's aria-selected from overriding the active state", async () => {
    await render(
      <TabBar accessibilityLabel="Main">
        <TabBarItem active aria-selected={false}>
          <TabBarLabel>Home</TabBarLabel>
        </TabBarItem>
      </TabBar>,
    );

    expect(screen.getByRole('tab', { name: 'Home', selected: true })).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const user = userEvent.setup();
    const onPressInbox = jest.fn();
    await render(<Example onPressInbox={onPressInbox} />);

    await user.press(screen.getByRole('tab', { name: 'Inbox' }));

    expect(onPressInbox).toHaveBeenCalledTimes(1);
  });

  it('takes an accessibilityLabel as its name when its label is hidden', async () => {
    await render(
      <TabBar accessibilityLabel="Main" labels="none">
        <TabBarItem accessibilityLabel="Home page">
          <TabBarIndicator />
        </TabBarItem>
      </TabBar>,
    );

    expect(screen.getByRole('tab', { name: 'Home page' })).toBeOnTheScreen();
  });

  it('tints the indicator only while the item is active', async () => {
    await render(<Example />);

    expect(classes('home-indicator')).toContain('bg-primary/10');
    expect(classes('inbox-indicator')).not.toContain('bg-primary/10');
  });

  it('mutes the indicator of an inactive item while it is pressed, and clears it on release', async () => {
    await render(<Example />);
    const inbox = screen.getByRole('tab', { name: 'Inbox' });
    expect(classes('inbox-indicator')).not.toContain('bg-muted');

    await fireEvent(inbox, 'pressIn');
    expect(classes('inbox-indicator')).toContain('bg-muted');

    await fireEvent(inbox, 'pressOut');
    expect(classes('inbox-indicator')).not.toContain('bg-muted');
  });

  it('keeps the active indicator tinted while it is pressed', async () => {
    await render(<Example />);

    await fireEvent(screen.getByRole('tab', { name: 'Home' }), 'pressIn');

    expect(classes('home-indicator')).toContain('bg-primary/10');
    expect(classes('home-indicator')).not.toContain('bg-muted');
  });

  it('uses no group class', async () => {
    await render(<Example />);

    for (const id of ['home-indicator', 'inbox-indicator']) {
      expect(classes(id).some((name) => name.includes('group'))).toBe(false);
    }
    expect(screen.getByRole('tab', { name: 'Inbox' }).props.className).not.toMatch(/group/);
  });
});

describe('TabBarBadge', () => {
  it('describes its item with the count and "new"', async () => {
    await render(<Example badge="3" />);

    // Testing Library reads the hidden count into the name; a device hides it with the badge.
    const inbox = screen.getByRole('tab', { name: /Inbox/ });
    expect(inbox.props.accessibilityHint).toBe('3 new');
    expect(screen.getByRole('tab', { name: 'Home' }).props.accessibilityHint).toBeUndefined();
  });

  it('says the countLabel it is given after the count', async () => {
    await render(<Example badge="12" countLabel="unread" />);

    expect(screen.getByRole('tab', { name: /Inbox/ }).props.accessibilityHint).toBe('12 unread');
  });

  it('draws a destructive badge hidden from a screen reader', async () => {
    await render(<Example badge="3" />);

    const badge = screen.getByTestId('badge', { includeHiddenElements: true });
    expect(badge.props['aria-hidden']).toBe(true);
    expect(emittedClasses(badge.props.className)).toContain('bg-destructive/10');
    expect(screen.queryByText('3')).toBeNull();
  });
});
