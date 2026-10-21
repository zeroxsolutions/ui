import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionProps } from './accordion';
import { Text } from './text';

const ITEMS = [
  { value: 'shipping', title: 'Shipping', body: 'Ships in 3 to 5 days.' },
  { value: 'returns', title: 'Returns', body: 'Returns within 30 days.' },
  { value: 'support', title: 'Support', body: 'Email us any time.' },
];

function Faq(props: AccordionProps) {
  return (
    <Accordion {...props}>
      {ITEMS.map((item) => (
        <AccordionItem key={item.value} value={item.value} testID={`item-${item.value}`}>
          <AccordionTrigger>
            <Text>{item.title}</Text>
          </AccordionTrigger>
          <AccordionContent testID={`content-${item.value}`}>
            <Text>{item.body}</Text>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const triggerOf = (title: string) => screen.getByRole('button', { name: title });

/** Reports the layout a device would give an item's content at `height`; Jest lays nothing out. */
async function layOut(value: string, height: number) {
  await fireEvent(screen.getByTestId(`content-${value}`, { includeHiddenElements: true }), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 320, height } },
  });
}

/** The view that clips an item's content to the height the animation has reached. */
function clipOf(value: string) {
  const clip = screen.getByTestId(`content-${value}`, { includeHiddenElements: true }).parent;
  if (clip === null) throw new Error(`The content of ${value} has no clip`);
  return clip;
}

describe('Accordion', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
  const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));
  const finishMotion = () => elapse(400);

  it('has triggers announced as collapsed buttons, and renders no content while closed', async () => {
    await render(<Faq />);

    for (const item of ITEMS) expect(triggerOf(item.title)).toBeCollapsed();
    expect(screen.queryByText('Ships in 3 to 5 days.')).toBeNull();
  });

  it('opens an item when its trigger is pressed, announced as expanded', async () => {
    const user = userEvent.setup();
    await render(<Faq />);

    await user.press(triggerOf('Shipping'));

    expect(triggerOf('Shipping')).toBeExpanded();
    expect(screen.getByText('Ships in 3 to 5 days.')).toBeVisible();
  });

  it('opens the items in defaultValue', async () => {
    await render(<Faq defaultValue={['returns']} />);

    expect(triggerOf('Returns')).toBeExpanded();
    expect(screen.getByText('Returns within 30 days.')).toBeVisible();
  });

  it('closes the open item when another opens', async () => {
    const user = userEvent.setup();
    await render(<Faq defaultValue={['shipping']} />);

    await user.press(triggerOf('Returns'));
    await finishMotion();

    expect(triggerOf('Returns')).toBeExpanded();
    expect(triggerOf('Shipping')).toBeCollapsed();
    expect(screen.queryByText('Ships in 3 to 5 days.')).toBeNull();
  });

  it('closes the open item when its own trigger is pressed', async () => {
    const user = userEvent.setup();
    await render(<Faq defaultValue={['shipping']} />);

    await user.press(triggerOf('Shipping'));
    await finishMotion();

    expect(triggerOf('Shipping')).toBeCollapsed();
    expect(screen.queryByText('Ships in 3 to 5 days.')).toBeNull();
  });

  it('keeps several items open when multiple', async () => {
    const user = userEvent.setup();
    await render(<Faq multiple />);

    await user.press(triggerOf('Shipping'));
    await user.press(triggerOf('Returns'));

    expect(triggerOf('Shipping')).toBeExpanded();
    expect(triggerOf('Returns')).toBeExpanded();
  });

  it('follows a controlled value and reports the open items through onValueChange', async () => {
    const onValueChange = jest.fn();
    function Controlled() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Faq
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange(next);
          }}
        />
      );
    }
    const user = userEvent.setup();
    await render(<Controlled />);

    await user.press(triggerOf('Returns'));
    await user.press(triggerOf('Support'));

    expect(onValueChange.mock.calls).toEqual([[['returns']], [['support']]]);
    expect(triggerOf('Support')).toBeExpanded();
    expect(triggerOf('Returns')).toBeCollapsed();
  });

  it('stays closed when a controlled value refuses the change', async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(<Faq value={[]} onValueChange={onValueChange} />);

    await user.press(triggerOf('Shipping'));

    expect(onValueChange).toHaveBeenCalledWith(['shipping']);
    expect(triggerOf('Shipping')).toBeCollapsed();
    expect(screen.queryByText('Ships in 3 to 5 days.')).toBeNull();
  });

  it('announces a disabled item, dims its trigger and ignores its presses', async () => {
    const user = userEvent.setup();
    await render(
      <Accordion>
        <AccordionItem value="a" disabled>
          <AccordionTrigger>
            <Text>Archived</Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text>Gone</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.press(triggerOf('Archived'));

    expect(triggerOf('Archived')).toBeDisabled();
    expect(emittedClasses(triggerOf('Archived').props.className)).toContain('opacity-50');
    expect(screen.queryByText('Gone')).toBeNull();
  });

  it.each(['vega', 'nova'] as const)(
    'draws a border in the border colour under every item but the last in %s',
    async (style) => {
      await render(<Faq />);

      for (const value of ['shipping', 'returns']) {
        expect(emittedClasses(screen.getByTestId(`item-${value}`).props.className, style)).toEqual(
          expect.arrayContaining(['border-b', 'border-border']),
        );
      }
      expect(emittedClasses(screen.getByTestId('item-support').props.className, style)).not.toContain('border-b');
    },
  );

  describe('motion', () => {
    it('grows the content from no height to its own over 200ms when it opens', async () => {
      const user = userEvent.setup();
      await render(<Faq />);

      await user.press(triggerOf('Shipping'));
      await layOut('shipping', 120);
      await elapse(100);

      expect(clipOf('shipping')).not.toHaveAnimatedStyle({ height: 0 });
      expect(clipOf('shipping')).not.toHaveAnimatedStyle({ height: 120 });

      await elapse(150);

      expect(clipOf('shipping')).toHaveAnimatedStyle({ height: 120 });
    });

    it('shrinks the content to no height over 200ms when it closes, then removes it', async () => {
      const user = userEvent.setup();
      await render(<Faq defaultValue={['shipping']} />);
      await layOut('shipping', 120);

      await user.press(triggerOf('Shipping'));
      await elapse(100);

      expect(triggerOf('Shipping')).toBeCollapsed();
      expect(screen.getByTestId('content-shipping', { includeHiddenElements: true })).not.toBeVisible();
      expect(clipOf('shipping')).not.toHaveAnimatedStyle({ height: 120 });

      await elapse(150);

      expect(screen.queryByTestId('content-shipping', { includeHiddenElements: true })).toBeNull();
    });

    it('opens and closes at once when the system asks for reduced motion', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      const user = userEvent.setup();
      await render(<Faq />);
      // The reduced motion setting is read once the content mounts, and arrives a promise later.
      await act(async () => {});

      await user.press(triggerOf('Shipping'));
      await layOut('shipping', 120);
      await elapse(16);

      expect(clipOf('shipping')).toHaveAnimatedStyle({ height: 120 });

      await user.press(triggerOf('Shipping'));

      expect(screen.queryByTestId('content-shipping', { includeHiddenElements: true })).toBeNull();
    });
  });
});
