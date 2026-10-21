import { PortalHost } from '@rn-primitives/portal';
import { useState } from 'react';
import { act, configure, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu';
import type { ContextMenuContentProps, ContextMenuProps } from './context-menu';
import { AppScreen, catchBackPress, followAccessibilityFocus, outermostView } from './overlay.testing';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open menu from them; the specs on its motion read the animated style instead.
configure({ defaultIncludeHiddenElements: true });

/** Where a finger long-presses the trigger, on the screen. */
const PRESS = { pageX: 120, pageY: 240 };

interface AccountProps {
  withHost?: boolean;
  root?: ContextMenuProps;
  content?: Omit<ContextMenuContentProps, 'children'>;
  onProfile?: () => void;
  onLogOut?: () => void;
}

/** Upstream's demo, cut down: an account menu with a group, a sub-menu and a destructive item. */
function Account({ withHost = true, root, content, onProfile, onLogOut }: AccountProps) {
  return (
    <>
      <ContextMenu {...root}>
        <ContextMenuTrigger testID="trigger" className="h-36 items-center justify-center border border-dashed">
          <Text>Right click here</Text>
        </ContextMenuTrigger>
        <ContextMenuContent testID="content" {...content}>
          <ContextMenuGroup>
            <ContextMenuLabel>My Account</ContextMenuLabel>
            <ContextMenuItem onPress={onProfile} testID="profile">
              <Text>Profile</Text>
              <ContextMenuShortcut>{'\u21E7\u2318P'}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Text>API</Text>
            </ContextMenuItem>
            <ContextMenuItem closeOnClick={false}>
              <Text>Keyboard shortcuts</Text>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Text>Invite users</Text>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>
                <Text>Email</Text>
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuItem variant="destructive" inset onPress={onLogOut} testID="log-out">
            <Text>Log out</Text>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {withHost && <PortalHost />}
    </>
  );
}

/** A view menu, as upstream's checkbox and radio examples hold one. */
function ViewMenu({ onPanelChange }: { onPanelChange?: (value: string) => void }) {
  const [statusBar, setStatusBar] = useState(true);
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Text>View</Text>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked={statusBar} onCheckedChange={setStatusBar}>
            <Text>Status Bar</Text>
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem defaultChecked={false}>
            <Text>Activity Bar</Text>
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup defaultValue="bottom" onValueChange={onPanelChange}>
            <ContextMenuRadioItem value="top">
              <Text>Top</Text>
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="bottom">
              <Text>Bottom</Text>
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <PortalHost />
    </>
  );
}

const trigger = (name = 'Right click here') => screen.getByRole('button', { name });
const menu = () => screen.getByTestId('content');
/** The layer inside the content that fades, grows and slides. */
const box = () => menu().children[0] as ReturnType<typeof screen.getByTestId>;
const item = (name: string | RegExp) => screen.getByRole('menuitem', { name });

/** The layer behind the content that a press outside it lands on. */
function outside() {
  const layer = menu().parent?.children[0];
  if (layer === undefined || typeof layer === 'string') throw new Error('The menu has no outside layer');
  return layer;
}

/** Long-presses the trigger named `name` where {@link PRESS} is, as a finger does. */
async function longPress(name?: string) {
  await fireEvent(trigger(name), 'longPress', { nativeEvent: PRESS });
}

describe('ContextMenu', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets `ms` pass on Jest's clock, running the animation frames and timers due in it. */
  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(300);
  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  async function open(props: AccountProps = {}) {
    const user = setUp();
    await render(<Account {...props} />);
    await longPress();
    await finishMotion();
    return user;
  }

  it('draws no menu until its area is long-pressed, and none for a short press', async () => {
    const user = setUp();
    await render(<Account />);
    await user.press(trigger());
    await finishMotion();

    expect(trigger()).toBeCollapsed();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('opens a menu of menu items when its area is long-pressed', async () => {
    await open();

    expect(menu()).toHaveProp('role', 'menu');
    expect(trigger()).toBeExpanded();
    // The shortcut is read after the item's name, as upstream's is.
    expect(item('Profile \u21E7\u2318P')).toBeOnTheScreen();
    expect(item('Log out')).toBeOnTheScreen();
  });

  it('runs an item and closes when the item is pressed', async () => {
    const onProfile = jest.fn();
    const user = await open({ onProfile });

    await user.press(item(/^Profile/));
    await finishMotion();

    expect(onProfile).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('content')).toBeNull();
    expect(trigger()).toBeCollapsed();
  });

  it('stays open after an item whose closeOnClick is false is pressed', async () => {
    const user = await open();

    await user.press(item('Keyboard shortcuts'));
    await finishMotion();

    expect(menu()).toBeOnTheScreen();
  });

  it('dims a disabled item, announces it as disabled and ignores a press on it', async () => {
    const user = await open();

    await user.press(item('API'));
    await finishMotion();

    expect(item('API')).toBeDisabled();
    expect(emittedClasses(item('API').props.className)).toContain('opacity-50');
    expect(menu()).toBeOnTheScreen();
  });

  it('opens a sub-menu from its trigger, and closes it on a second press', async () => {
    const user = await open();
    const subTrigger = item('Invite users');
    expect(subTrigger).toBeCollapsed();
    expect(screen.queryByRole('menuitem', { name: 'Email' })).toBeNull();

    await user.press(subTrigger);
    expect(item('Invite users')).toBeExpanded();
    expect(item('Email')).toBeOnTheScreen();

    await user.press(item('Invite users'));
    expect(item('Invite users')).toBeCollapsed();
    expect(screen.queryByRole('menuitem', { name: 'Email' })).toBeNull();
  });

  it('closes on a press outside its content', async () => {
    const user = await open();

    await user.press(outside());
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
    expect(trigger()).toBeCollapsed();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    await open();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it("closes on the screen reader's escape gesture", async () => {
    await open();

    await act(async () => {
      menu().props.onAccessibilityEscape();
    });
    await finishMotion();

    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the menu as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = await open();
    expect(focused()).toBe('content');

    await user.press(outside());
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('opens below where the finger pressed, 4px along from it', async () => {
    await open();
    await act(async () => {
      menu().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 120 } } });
    });

    expect(menu()).toHaveStyle({ top: PRESS.pageY, left: PRESS.pageX + 4 });
  });

  it("opens from a screen reader's long-press action on its area", async () => {
    await render(<Account />);

    await fireEvent(trigger(), 'accessibilityAction', { nativeEvent: { actionName: 'longpress' } });
    await finishMotion();

    expect(menu()).toHaveProp('role', 'menu');
  });

  it('highlights an item while a finger is on it', async () => {
    await open();
    const profile = screen.getByTestId('profile');
    expect(emittedClasses(profile.props.className)).not.toContain('bg-accent');

    await fireEvent(profile, 'pressIn');
    expect(emittedClasses(screen.getByTestId('profile').props.className)).toContain('bg-accent');

    await fireEvent(screen.getByTestId('profile'), 'pressOut');
    expect(emittedClasses(screen.getByTestId('profile').props.className)).not.toContain('bg-accent');
  });

  it('draws a destructive item in the destructive colour, and an inset one indented', async () => {
    await open();
    const logOut = screen.getByTestId('log-out');

    expect(emittedClasses(logOut.props.className)).toContain('pl-8');
    expect(emittedClasses(screen.getByText('Log out').props.className)).toContain('text-destructive');

    await fireEvent(logOut, 'pressIn');
    expect(emittedClasses(screen.getByTestId('log-out').props.className)).toContain('bg-destructive/10');
  });

  it('announces a checkbox item checked or not, and toggles it in place when pressed', async () => {
    const user = setUp();
    await render(<ViewMenu />);
    await longPress('View');
    await finishMotion();

    const statusBar = screen.getByRole('checkbox', { name: 'Status Bar' });
    expect(statusBar).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Activity Bar' })).not.toBeChecked();

    await user.press(statusBar);
    await user.press(screen.getByRole('checkbox', { name: 'Activity Bar' }));

    expect(screen.getByRole('checkbox', { name: 'Status Bar' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Activity Bar' })).toBeChecked();
  });

  it('announces the chosen radio item checked, and moves the choice when another is pressed', async () => {
    const onPanelChange = jest.fn();
    const user = setUp();
    await render(<ViewMenu onPanelChange={onPanelChange} />);
    await longPress('View');
    await finishMotion();

    expect(screen.getByRole('radio', { name: 'Bottom' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Top' })).not.toBeChecked();

    await user.press(screen.getByRole('radio', { name: 'Top' }));

    expect(onPanelChange).toHaveBeenCalledWith('top');
    expect(screen.getByRole('radio', { name: 'Top' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Bottom' })).not.toBeChecked();
  });

  it('slides in from where it opened', async () => {
    await render(<Account />);

    await longPress();
    await elapse(16);
    const [slide, grow] = getAnimatedStyle(box()).transform as [{ translateY: number }, { scale: number }];
    expect(slide.translateY).toBeLessThan(0);
    expect(grow.scale).toBeLessThan(1);
    await finishMotion();
    expect(box()).toHaveAnimatedStyle({
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
    });
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = setUp();
    await render(<Account />);
    await elapse(0);

    await longPress();
    expect(box()).not.toHaveAnimatedStyle({ opacity: 0 });

    await user.press(outside());
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await render(<Account withHost={false} />);

    await longPress();
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^ContextMenu opened, but no <PortalHost \/>/));
  });

  it('reports opening and closing through onOpenChange', async () => {
    const onOpenChange = jest.fn();
    const user = await open({ root: { onOpenChange } });

    await user.press(outside());
    await finishMotion();

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("hides the screen behind it from screen readers while open, as upstream's modal menu does", async () => {
    const user = setUp();
    await render(
      <>
        <AppScreen />
        <Account />
      </>,
    );
    await longPress();
    await finishMotion();

    expect(screen.queryByTestId('app-screen', { includeHiddenElements: false })).toBeNull();
    expect(outermostView(menu())).toHaveProp('accessibilityViewIsModal', true);

    await user.press(outside());
    await finishMotion();
    expect(screen.getByTestId('app-screen', { includeHiddenElements: false })).toBeOnTheScreen();
  });
});
