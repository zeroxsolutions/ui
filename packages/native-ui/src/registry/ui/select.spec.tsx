import { PortalHost } from '@rn-primitives/portal';
import { useState } from 'react';
import { act, configure, fireEvent, render, screen, userEvent, within } from '@testing-library/react-native';
import { AccessibilityInfo, Dimensions, View } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';
import type { SelectProps, SelectTriggerProps } from './select';
import { AppScreen, catchBackPress, followAccessibilityFocus, outermostView, scrollerAround } from './overlay.testing';

// Jest runs no Reanimated frame into the props a query reads, so the opacity the fade starts at hides the
// open list from them.
configure({ defaultIncludeHiddenElements: true });

/** Where a device lays the trigger out on the screen: 192px wide and 36px tall, its top left at (20, 100). */
const TRIGGER = { x: 20, y: 100, width: 192, height: 36 };

const FRUITS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
];

interface FruitProps {
  withHost?: boolean;
  root?: SelectProps;
  trigger?: Omit<SelectTriggerProps, 'children'>;
}

/** Upstream's demo: a fruit picker with a group label, and a disabled choice after a separator. */
function Fruit({ withHost = true, root, trigger }: FruitProps) {
  return (
    <>
      <Select items={FRUITS} {...root}>
        <SelectTrigger testID="trigger" aria-label="Fruit" {...trigger}>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent testID="content">
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            {FRUITS.map((fruit) => (
              <SelectItem key={fruit.value} value={fruit.value}>
                {fruit.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="grapes" disabled>
            Grapes
          </SelectItem>
        </SelectContent>
      </Select>
      {withHost && <PortalHost />}
    </>
  );
}

/** A select whose owner holds the chosen value, and shows it beside the select. */
function OwnedFruit() {
  const [fruit, setFruit] = useState('banana');
  return (
    <>
      <Fruit root={{ value: fruit, onValueChange: setFruit }} />
      <View testID="owner" accessibilityLabel={fruit} />
    </>
  );
}

const trigger = () => screen.getByTestId('trigger');
const list = () => screen.getByTestId('content');
const option = (name: string) => screen.getByRole('option', { name });

/** The layer behind the list that a press outside it lands on. */
function outside() {
  const layer = list().parent?.children[0];
  if (layer === undefined || typeof layer === 'string') throw new Error('The list has no outside layer');
  return layer;
}

/** Reports where a device lays out the trigger; Jest lays nothing out. */
function layOutTrigger() {
  jest
    .spyOn(View.prototype as unknown as { measure: (callback: (...args: number[]) => void) => void }, 'measure')
    .mockImplementation((callback) => callback(0, 0, TRIGGER.width, TRIGGER.height, TRIGGER.x, TRIGGER.y));
}

describe('Select', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    layOutTrigger();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(300);
  const setUp = () => userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  async function open(props: FruitProps = {}) {
    const user = setUp();
    await render(<Fruit {...props} />);
    await user.press(trigger());
    await finishMotion();
    return user;
  }

  it('is a collapsed combobox showing its placeholder, muted, until something is chosen', async () => {
    await render(<Fruit />);

    expect(trigger()).toHaveProp('role', 'combobox');
    expect(trigger()).toBeCollapsed();
    expect(screen.getByText('Select a fruit')).toBeOnTheScreen();
    expect(emittedClasses(screen.getByText('Select a fruit').props.className)).toContain('text-muted-foreground');
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('scrolls its items on a device once they pass the screen, 16px in from each edge', async () => {
    await open();

    const scroller = scrollerAround(within(list()).getAllByRole('option')[0]);
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveStyle({ maxHeight: Dimensions.get('window').height - 32 });
  });

  it('opens a list of options when its trigger is pressed', async () => {
    await open();

    expect(trigger()).toBeExpanded();
    expect(option('Apple')).toBeOnTheScreen();
    expect(option('Blueberry')).toBeOnTheScreen();
    expect(screen.getByText('Fruits')).toBeOnTheScreen();
  });

  it("shows the chosen option's label, closes, and reports its value", async () => {
    const onValueChange = jest.fn();
    const user = await open({ root: { onValueChange } });

    await user.press(option('Banana'));
    await finishMotion();

    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(screen.queryByTestId('content')).toBeNull();
    expect(trigger()).toBeCollapsed();
    expect(screen.getByText('Banana')).toBeOnTheScreen();
    expect(emittedClasses(screen.getByText('Banana').props.className)).not.toContain('text-muted-foreground');
  });

  it('announces the chosen option as selected, with a check mark beside it', async () => {
    const user = await open({ root: { defaultValue: 'blueberry' } });

    expect(option('Blueberry')).toBeSelected();
    expect(option('Apple')).not.toBeSelected();
    expect(screen.getAllByTestId('select-check')).toHaveLength(1);

    await user.press(option('Apple'));
    await user.press(trigger());
    await finishMotion();
    expect(option('Apple')).toBeSelected();
    expect(option('Blueberry')).not.toBeSelected();
  });

  it("shows the label of a value it starts with, from the select's items, before it is opened", async () => {
    await render(<Fruit root={{ defaultValue: 'blueberry' }} />);

    expect(screen.getByText('Blueberry')).toBeOnTheScreen();
  });

  it('follows the value its owner holds', async () => {
    const user = setUp();
    await render(<OwnedFruit />);
    expect(screen.getByText('Banana')).toBeOnTheScreen();

    await user.press(trigger());
    await finishMotion();
    await user.press(option('Apple'));
    await finishMotion();

    expect(screen.getByTestId('owner')).toHaveProp('accessibilityLabel', 'apple');
    expect(screen.getByText('Apple')).toBeOnTheScreen();
  });

  it('announces a disabled option as disabled, dims it and ignores a press on it', async () => {
    const onValueChange = jest.fn();
    const user = await open({ root: { onValueChange } });

    await user.press(option('Grapes'));

    expect(option('Grapes')).toBeDisabled();
    expect(emittedClasses(option('Grapes').props.className)).toContain('opacity-50');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('highlights an option while a finger is on it', async () => {
    await open();

    await fireEvent(option('Apple'), 'pressIn');

    expect(emittedClasses(option('Apple').props.className)).toContain('bg-accent');
  });

  it('closes on a press outside its list, and on the back button', async () => {
    const pressBack = catchBackPress();
    const user = await open();

    await user.press(outside());
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();

    await user.press(trigger());
    await finishMotion();
    expect(await pressBack()).toBe(true);
    await finishMotion();
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('moves accessibility focus into the list as it opens, and back to the trigger as it closes', async () => {
    const focused = followAccessibilityFocus();
    const user = await open();
    expect(focused()).toBe('content');

    await user.press(outside());
    await finishMotion();
    expect(focused()).toBe('trigger');
  });

  it('opens 4px below its trigger, centred on it', async () => {
    await open();
    await act(async () => {
      list().props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 192, height: 120 } } });
    });

    expect(list()).toHaveStyle({ top: TRIGGER.y + TRIGGER.height + 4, left: TRIGGER.x });
  });

  it('draws the small size and the invalid state on its trigger', async () => {
    await render(<Fruit trigger={{ size: 'sm', 'aria-invalid': true }} />);

    expect(emittedClasses(trigger().props.className)).toEqual(expect.arrayContaining(['h-8', 'border-destructive']));
  });

  it('opens from the start with defaultOpen', async () => {
    await render(<Fruit root={{ defaultOpen: true }} />);
    await finishMotion();

    expect(list()).toBeOnTheScreen();
  });

  it('appears and goes at once when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const user = setUp();
    await render(<Fruit />);
    await elapse(0);

    await user.press(trigger());
    expect(list().children[0]).not.toHaveAnimatedStyle({ opacity: 0 });

    await user.press(outside());
    expect(screen.queryByTestId('content')).toBeNull();
  });

  it('reports, while developing, opening with no PortalHost to draw it', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = setUp();
    await render(<Fruit withHost={false} />);

    await user.press(trigger());
    await elapse(1_000);

    expect(error).toHaveBeenCalledWith(expect.stringMatching(/^Select opened, but no <PortalHost \/>/));
  });

  it('hides the screen behind it from screen readers while open', async () => {
    const user = setUp();
    await render(
      <>
        <AppScreen />
        <Fruit />
      </>,
    );
    await user.press(trigger());
    await finishMotion();

    expect(screen.queryByTestId('app-screen', { includeHiddenElements: false })).toBeNull();
    expect(outermostView(list())).toHaveProp('accessibilityViewIsModal', true);
  });
});
