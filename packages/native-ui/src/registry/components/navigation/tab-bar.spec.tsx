import { render, screen, userEvent } from '@testing-library/react-native';
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
} from './tab-bar';
import { Icon } from '../../ui/icon';

type ExampleProps = {
  side?: TabBarSide;
  labels?: TabBarLabels;
  shape?: TabBarShape;
  badge?: string;
  countLabel?: string;
  onPressInbox?: () => void;
};

function Example({ side, labels, shape, badge, countLabel, onPressInbox }: ExampleProps) {
  return (
    <TabBar accessibilityLabel="Main" testID="bar" side={side} labels={labels} shape={shape}>
      <TabBarItem active>
        <TabBarIndicator>
          <TabBarIcon>
            <Icon as={House} />
          </TabBarIcon>
        </TabBarIndicator>
        <TabBarLabel>Home</TabBarLabel>
      </TabBarItem>
      <TabBarItem onPress={onPressInbox}>
        <TabBarIndicator>
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

  it.each(['left', 'right'] as const)(
    'leaves the screen beside a floating bar on the %s edge touchable',
    async (side) => {
      await render(<Example side={side} shape="floating" />);

      expect(screen.getByTestId('bar-wrapper').props.pointerEvents).toBe('box-none');
    },
  );

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
    expect(classes('inbox-label')).toContain('opacity-0');
    expect(screen.getByRole('tab', { name: 'Inbox' })).toBeOnTheScreen();
  });

  it('shows no label for labels "none", and keeps every item named', async () => {
    await render(<Example labels="none" />);

    expect(emittedClasses(screen.getByText('Home').props.className)).toContain('opacity-0');
    expect(classes('inbox-label')).toContain('opacity-0');
    expect(screen.getByRole('tab', { name: 'Home' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Inbox' })).toBeOnTheScreen();
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

  it('draws its badge hidden from a screen reader', async () => {
    await render(<Example badge="3" />);

    const badge = screen.getByTestId('badge', { includeHiddenElements: true });
    expect(badge.props['aria-hidden']).toBe(true);
    expect(screen.queryByText('3')).toBeNull();
  });
});
