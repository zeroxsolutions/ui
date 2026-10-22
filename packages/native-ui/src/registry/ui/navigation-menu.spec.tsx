import { PortalHost } from '@rn-primitives/portal';
import { act, configure, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
} from './navigation-menu';
import type { NavigationMenuProps } from './navigation-menu';
import { catchBackPress } from './overlay.testing';
import { Text } from './text';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open content from them.
configure({ defaultIncludeHiddenElements: true });

/** Where a device lays every trigger out on the screen. */
const TRIGGER = { x: 20, y: 100, width: 120, height: 36 };

function Menu({
  withHost = true,
  onIntroduction,
  positioner,
  ...props
}: NavigationMenuProps & {
  withHost?: boolean;
  onIntroduction?: () => void;
  positioner?: ReactNode;
}) {
  return (
    <>
      <NavigationMenu testID="nav" {...props}>
        {positioner}
        <NavigationMenuList>
          <NavigationMenuItem value="start">
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent testID="start-content">
              <NavigationMenuLink onPress={onIntroduction}>
                <Text>Introduction</Text>
              </NavigationMenuLink>
              <NavigationMenuLink active>
                <Text>Installation</Text>
              </NavigationMenuLink>
            </NavigationMenuContent>
            <NavigationMenuIndicator testID="indicator" />
          </NavigationMenuItem>
          <NavigationMenuItem value="icons">
            <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
            <NavigationMenuContent testID="icons-content">
              <NavigationMenuLink closeOnClick={false}>
                <Text>Backlog</Text>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink>Docs</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {withHost && <PortalHost />}
    </>
  );
}

const trigger = (name: string) => screen.getByRole('button', { name });
const content = (id: 'start' | 'icons') => screen.queryByTestId(`${id}-content`);

/** The layer behind the open content that a press outside it lands on. */
function outside(id: 'start' | 'icons') {
  const layer = screen.getByTestId(`${id}-content`).parent?.children[0];
  if (layer === undefined || typeof layer === 'string') throw new Error('The content has no outside layer');
  return layer;
}

describe('NavigationMenu', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest
      .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
      .mockImplementation((callback) => callback(0, 0, TRIGGER.width, TRIGGER.height, TRIGGER.x, TRIGGER.y));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(400);
  const setup = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  it('is a navigation landmark named Main holding a list of items, with every content closed', async () => {
    await render(<Menu />);

    expect(screen.getByTestId('nav')).toHaveProp('role', 'navigation');
    expect(screen.getByTestId('nav')).toHaveProp('aria-label', 'Main');
    expect(screen.getByTestId('nav').children[0]).toHaveProp('role', 'list');
    expect(trigger('Getting started')).toBeCollapsed();
    expect(content('start')).toBeNull();
    expect(screen.getByRole('link', { name: 'Docs' })).toBeOnTheScreen();
  });

  it('takes the name it is given', async () => {
    await render(<Menu aria-label="Docs sections" />);

    expect(screen.getByTestId('nav')).toHaveProp('aria-label', 'Docs sections');
  });

  it("opens an item's content of links when its trigger is pressed", async () => {
    const user = setup();
    await render(<Menu />);

    await user.press(trigger('Getting started'));
    await finishMotion();

    expect(content('start')).toBeOnTheScreen();
    expect(trigger('Getting started')).toBeExpanded();
    expect(screen.getByRole('link', { name: 'Introduction' })).toBeOnTheScreen();
    expect(content('icons')).toBeNull();
  });

  it('is not announced as a modal dialog, so a screen reader still reaches the screen', async () => {
    const user = setup();
    await render(<Menu />);

    await user.press(trigger('Getting started'));
    await finishMotion();

    expect(screen.getByTestId('start-content')).not.toHaveProp('role', 'dialog');
    expect(screen.getByTestId('start-content')).not.toHaveProp('aria-modal', true);
  });

  it('closes when its trigger is pressed again', async () => {
    const user = setup();
    await render(<Menu />);

    await user.press(trigger('Getting started'));
    await finishMotion();
    await user.press(trigger('Getting started'));
    await finishMotion();

    expect(content('start')).toBeNull();
    expect(trigger('Getting started')).toBeCollapsed();
  });

  it('closes on a press outside its content', async () => {
    const user = setup();
    await render(<Menu />);
    await user.press(trigger('Getting started'));
    await finishMotion();

    await user.press(outside('start'));
    await finishMotion();

    expect(content('start')).toBeNull();
    expect(trigger('Getting started')).toBeCollapsed();
  });

  it('closes on the back button, and takes the press so the screen does not go back', async () => {
    const pressBack = catchBackPress();
    const user = setup();
    await render(<Menu />);
    await user.press(trigger('Getting started'));
    await finishMotion();

    const handled = await pressBack();
    await finishMotion();

    expect(handled).toBe(true);
    expect(content('start')).toBeNull();
  });

  it('closes when a link in it is pressed, after running the link', async () => {
    const onIntroduction = jest.fn();
    const user = setup();
    await render(<Menu onIntroduction={onIntroduction} />);
    await user.press(trigger('Getting started'));
    await finishMotion();

    await user.press(screen.getByRole('link', { name: 'Introduction' }));
    await finishMotion();

    expect(onIntroduction).toHaveBeenCalledTimes(1);
    expect(content('start')).toBeNull();
  });

  it('stays open when a link with closeOnClick false is pressed', async () => {
    const user = setup();
    await render(<Menu />);
    await user.press(trigger('With Icon'));
    await finishMotion();

    await user.press(screen.getByRole('link', { name: 'Backlog' }));
    await finishMotion();

    expect(content('icons')).toBeOnTheScreen();
  });

  it('announces the active link as selected', async () => {
    const user = setup();
    await render(<Menu />);
    await user.press(trigger('Getting started'));
    await finishMotion();

    expect(screen.getByRole('link', { name: 'Installation' })).toBeSelected();
    expect(screen.getByRole('link', { name: 'Introduction' })).not.toBeSelected();
  });

  it('draws its indicator only while its item is open', async () => {
    const user = setup();
    await render(<Menu />);
    expect(screen.queryByTestId('indicator')).toBeNull();

    await user.press(trigger('Getting started'));
    await finishMotion();

    expect(screen.getByTestId('indicator')).toBeOnTheScreen();
  });

  it('reports the item that opens and null as it closes through onValueChange', async () => {
    const onValueChange = jest.fn();
    const user = setup();
    await render(<Menu onValueChange={onValueChange} />);

    await user.press(trigger('With Icon'));
    await finishMotion();
    await user.press(outside('icons'));
    await finishMotion();

    expect(onValueChange.mock.calls).toEqual([['icons'], [null]]);
  });

  it('follows value, opening one item at a time', async () => {
    const view = await render(<Menu value="start" />);
    await finishMotion();
    expect(content('start')).toBeOnTheScreen();

    await view.rerender(<Menu value="icons" />);
    await finishMotion();
    expect(content('start')).toBeNull();
    expect(content('icons')).toBeOnTheScreen();

    await view.rerender(<Menu value={null} />);
    await finishMotion();
    expect(content('icons')).toBeNull();
  });

  it('starts with the defaultValue item open', async () => {
    await render(<Menu defaultValue="icons" />);
    await finishMotion();

    expect(content('icons')).toBeOnTheScreen();
    expect(trigger('With Icon')).toBeExpanded();
  });

  /** Reports the open content's size, as a device's layout would; Jest lays nothing out. */
  async function layOutContent(id: 'start' | 'icons', width: number, height: number) {
    await act(async () => {
      screen.getByTestId(`${id}-content`).props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
    });
  }

  it('opens the content 8px under its trigger, lined up with its start', async () => {
    const user = setup();
    await render(<Menu />);
    await user.press(trigger('Getting started'));
    await finishMotion();
    await layOutContent('start', 200, 120);

    expect(screen.getByTestId('start-content')).toHaveStyle({ top: TRIGGER.y + TRIGGER.height + 8, left: TRIGGER.x });
  });

  it('places the content where a NavigationMenuPositioner drawn inside the menu says', async () => {
    const user = setup();
    await render(<Menu positioner={<NavigationMenuPositioner sideOffset={20} />} />);
    await user.press(trigger('Getting started'));
    await finishMotion();
    await layOutContent('start', 200, 120);

    expect(screen.getByTestId('start-content')).toHaveStyle({ top: TRIGGER.y + TRIGGER.height + 20 });
  });

  describe('with a pointer', () => {
    it('opens an item once the pointer has rested on its trigger, and closes it once the pointer leaves', async () => {
      await render(<Menu />);

      await fireEvent(trigger('Getting started'), 'hoverIn', { nativeEvent: {} });
      expect(content('start')).toBeNull();
      await elapse(50);
      await finishMotion();
      expect(content('start')).toBeOnTheScreen();

      await fireEvent(trigger('Getting started'), 'hoverOut', { nativeEvent: {} });
      await elapse(50);
      await finishMotion();
      expect(content('start')).toBeNull();
    });

    it('moves to the item whose trigger the pointer rests on next', async () => {
      await render(<Menu />);

      await fireEvent(trigger('Getting started'), 'hoverIn', { nativeEvent: {} });
      await elapse(50);
      await finishMotion();
      await fireEvent(trigger('Getting started'), 'hoverOut', { nativeEvent: {} });
      await fireEvent(trigger('With Icon'), 'hoverIn', { nativeEvent: {} });
      await elapse(50);
      await finishMotion();

      expect(content('start')).toBeNull();
      expect(content('icons')).toBeOnTheScreen();
    });

    it('keeps the content open while the pointer moves from the trigger into it', async () => {
      await render(<Menu />);
      await fireEvent(trigger('Getting started'), 'hoverIn', { nativeEvent: {} });
      await elapse(50);
      await finishMotion();
      const panel = screen.getByTestId('start-content');
      const box = screen.getByRole('link', { name: 'Introduction' }).parent?.parent;
      if (box === undefined || box === null) throw new Error('The content has no box');

      await fireEvent(trigger('Getting started'), 'hoverOut', { nativeEvent: {} });
      await fireEvent(box, 'pointerEnter', { nativeEvent: { pointerType: 'mouse' } });
      await elapse(200);

      expect(panel).toBeOnTheScreen();
      expect(content('start')).toBeOnTheScreen();
    });

    it('keeps the content the pointer opened open when its trigger is then pressed, and after the pointer leaves', async () => {
      const user = setup();
      await render(<Menu />);
      await fireEvent(trigger('Getting started'), 'hoverIn', { nativeEvent: {} });
      await elapse(50);
      await finishMotion();

      await user.press(trigger('Getting started'));
      await finishMotion();
      expect(content('start')).toBeOnTheScreen();

      await fireEvent(trigger('Getting started'), 'hoverOut', { nativeEvent: {} });
      await elapse(200);
      expect(content('start')).toBeOnTheScreen();
    });
  });

  it('appears at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = setup();
    await render(<Menu />);
    await elapse(0);

    await user.press(trigger('Getting started'));

    const box = screen.getByTestId('start-content').children[0] as ReturnType<typeof screen.getByTestId>;
    expect(box).not.toHaveAnimatedStyle({ opacity: 0 });
    await user.press(outside('start'));
    expect(content('start')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = setup();
    await render(<Menu withHost={false} />);

    await user.press(trigger('Getting started'));
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^NavigationMenu opened, but no <PortalHost \/>/));
  });
});
