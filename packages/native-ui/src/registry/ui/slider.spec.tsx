import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Slider as NovaSlider } from '@styles/nova/components/ui/slider';
import { Slider, type SliderProps } from './slider';

type Element = ReturnType<typeof screen.getByTestId>;

/** The first element child of `element`. */
function firstChild(element: Element): Element {
  const [child] = element.children;
  if (child === undefined || typeof child === 'string') throw new Error('No element child');
  return child;
}

/** The control the thumbs ride on, inside the root each case renders as `slider`. */
function control(): Element {
  return firstChild(screen.getByTestId('slider'));
}

/** The track, the control's first child; the range is the track's. */
function track(): Element {
  return firstChild(control());
}

/** The control, sized as a layout pass sizes it. */
async function laidOut(width: number, height = 16): Promise<Element> {
  await fireEvent(control(), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  return control();
}

/** A touch at `location` within the control and at `page` on the screen, along `axis`. */
function touch(location: number, page: number, axis: 'x' | 'y' = 'x'): { nativeEvent: Record<string, number> } {
  return axis === 'x'
    ? { nativeEvent: { locationX: location, locationY: 0, pageX: page, pageY: 0 } }
    : { nativeEvent: { locationX: 0, locationY: location, pageX: 0, pageY: page } };
}

function thumbs(): Element[] {
  return screen.getAllByRole('adjustable');
}

function values(): number[] {
  return thumbs().map((thumb) => thumb.props['aria-valuenow']);
}

async function act(thumb: Element, actionName: 'increment' | 'decrement'): Promise<void> {
  await fireEvent(thumb, 'accessibilityAction', { nativeEvent: { actionName } });
}

function Controlled(props: SliderProps): ReactNode {
  const [value, setValue] = useState<number | readonly number[]>([0.3, 0.7]);
  return <Slider {...props} value={value} onValueChange={setValue} min={0} max={1} step={0.1} />;
}

describe('Slider', () => {
  it('announces one adjustable thumb with its range, value and value text', async () => {
    await render(<Slider testID="slider" defaultValue={50} aria-label="Volume" />);

    expect(thumbs()).toHaveLength(1);
    expect(thumbs()[0]).toHaveAccessibleName('Volume');
    expect(thumbs()[0]).toHaveAccessibilityValue({ min: 0, max: 100, now: 50, text: '50' });
  });

  it('draws two thumbs, at the ends, with no value', async () => {
    await render(<Slider testID="slider" aria-label="Price" />);

    expect(values()).toEqual([0, 100]);
    expect(thumbs().map((thumb) => thumb.props['aria-valuetext'])).toEqual(['0 start range', '100 end range']);
  });

  it("moves a step on the screen reader's increment and decrement, reporting the value in the shape it was given", async () => {
    const onValueChange = jest.fn();
    const onValueCommitted = jest.fn();
    await render(
      <Slider
        testID="slider"
        defaultValue={50}
        step={5}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );

    expect(thumbs()[0].props.accessibilityActions).toEqual([{ name: 'increment' }, { name: 'decrement' }]);
    await act(thumbs()[0], 'increment');
    expect(values()).toEqual([55]);
    expect(onValueChange).toHaveBeenLastCalledWith(55, { activeThumbIndex: 0 });
    expect(onValueCommitted).toHaveBeenLastCalledWith(55);

    await act(thumbs()[0], 'decrement');
    await act(thumbs()[0], 'decrement');
    expect(values()).toEqual([45]);
  });

  it('holds a value at its ends', async () => {
    await render(<Slider testID="slider" defaultValue={98} step={5} />);

    await act(thumbs()[0], 'increment');

    expect(values()).toEqual([100]);
  });

  it("keeps a range's thumbs from passing each other and reports an array", async () => {
    const onValueChange = jest.fn();
    await render(<Slider testID="slider" defaultValue={[25, 30]} step={10} onValueChange={onValueChange} />);

    await act(thumbs()[0], 'increment');

    expect(values()).toEqual([30, 30]);
    expect(onValueChange).toHaveBeenLastCalledWith([30, 30], { activeThumbIndex: 0 });
  });

  it('follows a controlled value', async () => {
    await render(<Controlled testID="slider" aria-label="Temperature" />);

    await act(thumbs()[1], 'increment');

    expect(values()).toEqual([0.3, 0.8]);
    expect(thumbs()[1].props['aria-valuetext']).toBe('0.8 end range');
  });

  it('moves a thumb with the keyboard', async () => {
    await render(<Slider testID="slider" defaultValue={50} />);
    const key = async (name: string): Promise<void> => {
      await fireEvent(thumbs()[0], 'keyDown', { nativeEvent: { key: name }, preventDefault: jest.fn() });
    };

    await key('ArrowRight');
    expect(values()).toEqual([51]);
    await key('ArrowDown');
    await key('ArrowDown');
    expect(values()).toEqual([49]);
    await key('PageUp');
    expect(values()).toEqual([59]);
    await key('End');
    expect(values()).toEqual([100]);
    await key('Home');
    expect(values()).toEqual([0]);
  });

  it('jumps to a press on the track and follows the finger, committing on release', async () => {
    const onValueCommitted = jest.fn();
    await render(<Slider testID="slider" defaultValue={0} onValueCommitted={onValueCommitted} />);
    const laid = await laidOut(200);

    await fireEvent(laid, 'responderGrant', touch(50, 150));
    expect(values()).toEqual([25]);
    await fireEvent(laid, 'responderMove', touch(0, 250));
    expect(values()).toEqual([75]);
    await fireEvent(laid, 'responderMove', touch(0, 900));
    expect(values()).toEqual([100]);
    await fireEvent(laid, 'responderRelease', touch(0, 900));

    expect(onValueCommitted).toHaveBeenCalledTimes(1);
    expect(onValueCommitted).toHaveBeenCalledWith(100);
  });

  it('moves the thumb nearest a press in a range', async () => {
    await render(<Slider testID="slider" defaultValue={[20, 80]} />);
    const laid = await laidOut(100);

    await fireEvent(laid, 'responderGrant', touch(70, 70));

    expect(values()).toEqual([20, 70]);
  });

  it('pushes the neighbour along a gap, and lets it back to where it started as the drag returns', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider testID="slider" defaultValue={[20, 50]} minStepsBetweenValues={5} onValueChange={onValueChange} />,
    );
    const laid = await laidOut(100);

    await fireEvent(laid, 'responderGrant', touch(20, 20));
    await fireEvent(laid, 'responderMove', touch(0, 70));
    expect(values()).toEqual([70, 75]);
    expect(onValueChange).toHaveBeenLastCalledWith([70, 75], { activeThumbIndex: 0 });

    await fireEvent(laid, 'responderMove', touch(0, 30));
    expect(values()).toEqual([30, 50]);
  });

  it('stops a thumb short of its neighbour by the gap with no collision', async () => {
    await render(
      <Slider testID="slider" defaultValue={[20, 50]} minStepsBetweenValues={5} thumbCollisionBehavior="none" />,
    );
    const laid = await laidOut(100);

    await fireEvent(laid, 'responderGrant', touch(20, 20));
    await fireEvent(laid, 'responderMove', touch(0, 70));

    expect(values()).toEqual([45, 50]);
  });

  it('hands the drag to the neighbour it meets with swap, keeping the gap', async () => {
    const onValueChange = jest.fn();
    await render(
      <Slider
        testID="slider"
        defaultValue={[20, 50]}
        minStepsBetweenValues={5}
        thumbCollisionBehavior="swap"
        onValueChange={onValueChange}
      />,
    );
    const laid = await laidOut(100);

    await fireEvent(laid, 'responderGrant', touch(20, 20));
    await fireEvent(laid, 'responderMove', touch(0, 50));
    expect(values()).toEqual([45, 50]);
    expect(onValueChange).toHaveBeenLastCalledWith([45, 50], { activeThumbIndex: 1 });

    await fireEvent(laid, 'responderMove', touch(0, 70));
    expect(values()).toEqual([45, 70]);
    expect(onValueChange).toHaveBeenLastCalledWith([45, 70], { activeThumbIndex: 1 });
  });

  it('rises from the bottom when vertical', async () => {
    await render(<Slider testID="slider" defaultValue={0} orientation="vertical" />);
    const laid = await laidOut(16, 100);

    await fireEvent(laid, 'responderGrant', touch(25, 25, 'y'));

    expect(values()).toEqual([75]);
  });

  it('takes no input and says so when disabled', async () => {
    await render(<Slider testID="slider" defaultValue={50} disabled />);
    const laid = await laidOut(100);

    await act(thumbs()[0], 'increment');

    expect(laid.props.onStartShouldSetResponder()).toBe(false);
    expect(values()).toEqual([50]);
    expect(thumbs()[0]).toBeDisabled();
  });

  it("draws Vega's track, range and thumb, the track thinner across when vertical", async () => {
    await render(<Slider testID="slider" defaultValue={50} />);

    expect(emittedClasses(track().props.className)).toEqual(
      expect.arrayContaining(['bg-muted', 'h-1.5', 'w-full', 'rounded-full']),
    );
    expect(emittedClasses(firstChild(track()).props.className)).toContain('bg-primary');
    expect(emittedClasses(thumbs()[0].props.className)).toEqual(
      expect.arrayContaining(['size-4', 'rounded-full', 'border-primary', 'bg-white']),
    );

    await render(<Slider testID="slider" defaultValue={50} orientation="vertical" />);
    expect(emittedClasses(track().props.className)).toEqual(expect.arrayContaining(['w-1.5', 'h-full']));
  });

  it("lays Nova's thumbs over the track, though Nova's thumb is relative", async () => {
    await render(<NovaSlider defaultValue={50} />);

    // The built item's own classes, unmerged: a device draws whatever the item passes.
    const classes: string[] = thumbs()[0].props.className.split(/\s+/);
    expect(classes).toContain('absolute');
    expect(classes).not.toContain('relative');
  });
});
