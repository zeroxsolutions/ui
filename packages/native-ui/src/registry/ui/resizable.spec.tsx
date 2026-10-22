import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createRef } from 'react';
import { I18nManager, Platform, ScrollView, StyleSheet } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { DirectionProvider } from './direction';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizableGroupImperativeHandle,
  type ResizablePanelGroupProps,
  type ResizablePanelImperativeHandle,
  type ResizablePanelProps,
} from './resizable';
import { Text } from './text';

type Drawn = ReturnType<typeof screen.getByTestId>;

interface PairProps extends ResizablePanelGroupProps {
  first?: ResizablePanelProps;
  second?: ResizablePanelProps;
  withHandle?: boolean;
}

/** Two panels, `left` and `right`, with a handle between them. */
function Pair({ first, second, withHandle, ...props }: PairProps) {
  return (
    <ResizablePanelGroup testID="group" {...props}>
      <ResizablePanel id="left" testID="left" defaultSize="25%" {...first}>
        <Text>Sidebar</Text>
      </ResizablePanel>
      <ResizableHandle testID="handle" withHandle={withHandle} />
      <ResizablePanel id="right" testID="right" defaultSize="75%" {...second}>
        <Text>Content</Text>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** How much the panel `testID` grows by, once the UI thread has drawn the layout. */
async function grow(testID: string): Promise<number> {
  await act(() => jest.advanceTimersByTimeAsync(100));
  return (getAnimatedStyle(screen.getByTestId(testID)) as { flexGrow?: number }).flexGrow ?? 0;
}

async function grows(): Promise<number[]> {
  return [await grow('left'), await grow('right')];
}

/**
 * Lays the group out `size` px along its direction with a 1px handle, as a layout pass does, so the panels
 * share `size - 1` px.
 */
async function layOut(size: number, axis: 'x' | 'y' = 'x'): Promise<void> {
  const box = (length: number) =>
    axis === 'x' ? { x: 0, y: 0, width: length, height: 200 } : { x: 0, y: 0, width: 200, height: length };
  await fireEvent(handle(), 'layout', { nativeEvent: { layout: box(1) } });
  const group = screen.getByTestId('group');
  const measurer = group.children[group.children.length - 1];
  if (typeof measurer === 'string') throw new Error('No measuring box');
  await fireEvent(measurer, 'layout', { nativeEvent: { layout: box(size) } });
}

function handle(): Drawn {
  return screen.getByTestId('handle');
}

function touch(page: number, axis: 'x' | 'y' = 'x', timestamp = 0) {
  return { nativeEvent: { pageX: axis === 'x' ? page : 0, pageY: axis === 'y' ? page : 0, timestamp } };
}

async function drag(from: number, to: number, axis: 'x' | 'y' = 'x'): Promise<void> {
  await fireEvent(handle(), 'responderGrant', touch(from, axis));
  await fireEvent(handle(), 'responderMove', touch(to, axis));
  await fireEvent(handle(), 'responderRelease', touch(to, axis));
}

async function press(key: string, shiftKey = false): Promise<void> {
  await fireEvent(handle(), 'keyDown', { nativeEvent: { key, shiftKey }, preventDefault: jest.fn() });
}

async function adjust(actionName: 'increment' | 'decrement'): Promise<void> {
  await fireEvent(handle(), 'accessibilityAction', { nativeEvent: { actionName } });
}

function styleOf(element: Drawn): Record<string, unknown> {
  return (StyleSheet.flatten(element.props.style) as Record<string, unknown> | undefined) ?? {};
}

describe('Resizable', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sizes the panels by their default sizes, in percent of the group', async () => {
    await render(<Pair />);
    await layOut(401);

    expect(await grows()).toEqual([25, 75]);
  });

  it('shares the room the sized panels leave between the panels with no size', async () => {
    await render(
      <ResizablePanelGroup testID="group">
        <ResizablePanel testID="a" defaultSize="40%" />
        <ResizableHandle />
        <ResizablePanel testID="b" />
        <ResizableHandle />
        <ResizablePanel testID="c" />
      </ResizablePanelGroup>,
    );

    expect([await grow('a'), await grow('b'), await grow('c')]).toEqual([40, 30, 30]);
  });

  it('reports the layout it starts from once the group is laid out', async () => {
    const onLayoutChange = jest.fn();
    const onLayoutChanged = jest.fn();
    await render(<Pair onLayoutChange={onLayoutChange} onLayoutChanged={onLayoutChanged} />);
    expect(onLayoutChanged).not.toHaveBeenCalled();

    await layOut(401);

    expect(onLayoutChange).toHaveBeenCalledWith({ left: 25, right: 75 });
    expect(onLayoutChanged).toHaveBeenCalledWith({ left: 25, right: 75 }, { isUserInteraction: false });
  });

  it('starts from a default layout that names every panel', async () => {
    await render(<Pair defaultLayout={{ left: 60, right: 40 }} />);

    expect(await grows()).toEqual([60, 40]);
  });

  it('announces the handle as adjustable, valued at the size of the panel before it and its range', async () => {
    await render(<Pair first={{ minSize: '10%', maxSize: '50%' }} />);
    await layOut(401);

    expect(screen.getByRole('adjustable')).toHaveAccessibilityValue({ min: 10, max: 50, now: 25, text: '25%' });
    expect(handle().props.accessibilityActions).toEqual([{ name: 'increment' }, { name: 'decrement' }]);
  });

  it("grows and shrinks the panel before the handle on a screen reader's increment and decrement", async () => {
    const onLayoutChanged = jest.fn();
    await render(<Pair onLayoutChanged={onLayoutChanged} />);
    await layOut(401);
    onLayoutChanged.mockClear();

    await adjust('increment');
    expect(await grows()).toEqual([30, 70]);
    expect(onLayoutChanged).toHaveBeenLastCalledWith({ left: 30, right: 70 }, { isUserInteraction: true });

    await adjust('decrement');
    await adjust('decrement');
    expect(await grows()).toEqual([20, 80]);
    expect(handle()).toHaveAccessibilityValue({ now: 20 });
  });

  it('holds each panel between its minimum and maximum size', async () => {
    await render(<Pair first={{ minSize: '20%' }} second={{ minSize: '60%' }} />);
    await layOut(401);

    await adjust('decrement');
    await adjust('decrement');
    expect(await grows()).toEqual([20, 80]);

    for (let step = 0; step < 6; step += 1) await adjust('increment');
    expect(await grows()).toEqual([40, 60]);
  });

  it('follows a drag of the handle, reporting each move and the layout once the drag ends', async () => {
    const onLayoutChange = jest.fn();
    const onLayoutChanged = jest.fn();
    await render(<Pair onLayoutChange={onLayoutChange} onLayoutChanged={onLayoutChanged} />);
    await layOut(401);
    onLayoutChange.mockClear();
    onLayoutChanged.mockClear();

    await fireEvent(handle(), 'responderGrant', touch(100));
    await fireEvent(handle(), 'responderMove', touch(120));
    await fireEvent(handle(), 'responderMove', touch(140));

    expect(await grows()).toEqual([35, 65]);
    expect(onLayoutChange).toHaveBeenLastCalledWith({ left: 35, right: 65 });
    expect(onLayoutChanged).not.toHaveBeenCalled();

    await fireEvent(handle(), 'responderRelease', touch(140));
    expect(onLayoutChanged).toHaveBeenCalledTimes(1);
    expect(onLayoutChanged).toHaveBeenCalledWith({ left: 35, right: 65 }, { isUserInteraction: true });
  });

  it("stops a drag at the panels' limits", async () => {
    await render(<Pair first={{ minSize: '10%', maxSize: '50%' }} />);
    await layOut(401);

    await drag(100, 0);
    expect(await grows()).toEqual([10, 90]);

    await drag(0, 400);
    expect(await grows()).toEqual([50, 50]);
  });

  it('reads sizes given in px against the group', async () => {
    await render(<Pair first={{ defaultSize: 100, minSize: 80 }} second={{ defaultSize: undefined }} />);
    await layOut(401);

    expect(await grows()).toEqual([25, 75]);

    await drag(100, 0);
    expect(await grows()).toEqual([20, 80]);
  });

  it('snaps a collapsible panel shut once a drag passes half its minimum, and open again', async () => {
    await render(<Pair first={{ collapsible: true, minSize: '20%' }} />);
    await layOut(401);

    await drag(100, 65);
    expect(await grows()).toEqual([20, 80]);

    await drag(100, 40);
    expect(await grows()).toEqual([0, 100]);

    await drag(0, 50);
    expect(await grows()).toEqual([20, 80]);
  });

  it('runs a vertical group down the screen', async () => {
    await render(<Pair orientation="vertical" />);
    await layOut(401, 'y');

    await drag(100, 140, 'y');

    expect(await grows()).toEqual([35, 65]);
    expect(styleOf(screen.getByTestId('group')).flexDirection).toBe('column');
  });

  it('keeps a drag of the handle from a scrolling parent', async () => {
    await render(
      <ScrollView horizontal>
        <Pair />
      </ScrollView>,
    );
    await layOut(401);

    expect(handle().props.onResponderGrant(touch(100))).toBe(true);
    expect(handle().props.onResponderTerminationRequest()).toBe(false);
  });

  it("draws no grip unless asked, and the style's grip when asked", async () => {
    await render(<Pair />);
    expect(handle().children.filter((child) => typeof child !== 'string')).toHaveLength(0);

    await render(<Pair withHandle />);
    const [grip] = handle().children;
    if (grip === undefined || typeof grip === 'string') throw new Error('No grip');
    expect(emittedClasses(grip.props.className)).toEqual(
      expect.arrayContaining(['bg-border', 'h-6', 'w-1', 'rounded-lg']),
    );
  });

  it('resets the panel before the handle to its default size on a double tap', async () => {
    await render(<Pair />);
    await layOut(401);
    await drag(100, 140);
    expect(await grows()).toEqual([35, 65]);

    await fireEvent(handle(), 'responderGrant', touch(140, 'x', 1000));
    await fireEvent(handle(), 'responderRelease', touch(140, 'x', 1000));
    await fireEvent(handle(), 'responderGrant', touch(140, 'x', 1200));
    await fireEvent(handle(), 'responderRelease', touch(140, 'x', 1200));

    expect(await grows()).toEqual([25, 75]);
  });

  it('blocks every way of resizing when the group is disabled', async () => {
    await render(<Pair disabled />);
    await layOut(401);

    await drag(100, 140);
    await adjust('increment');
    await press('ArrowRight');

    expect(await grows()).toEqual([25, 75]);
    expect(handle()).toBeDisabled();
  });

  it("reports each panel's size as it changes", async () => {
    const onResize = jest.fn();
    await render(<Pair first={{ onResize }} />);
    await layOut(401);

    expect(onResize).toHaveBeenLastCalledWith({ asPercentage: 25, inPixels: 100 }, 'left', undefined);

    await adjust('increment');
    expect(onResize).toHaveBeenLastCalledWith({ asPercentage: 30, inPixels: 120 }, 'left', {
      asPercentage: 25,
      inPixels: 100,
    });
  });

  it('keeps a panel that keeps its pixels at its px as the group changes size', async () => {
    await render(<Pair first={{ groupResizeBehavior: 'preserve-pixel-size' }} />);
    await layOut(401);

    await layOut(801);

    expect(await grows()).toEqual([12.5, 87.5]);
  });

  it('reads and sets the layout through the group ref', async () => {
    const groupRef = createRef<ResizableGroupImperativeHandle>();
    await render(<Pair groupRef={groupRef} first={{ minSize: '20%' }} />);
    await layOut(401);

    expect(groupRef.current?.getLayout()).toEqual({ left: 25, right: 75 });

    let applied;
    await act(async () => {
      applied = groupRef.current?.setLayout({ left: 10, right: 90 });
    });
    expect(applied).toEqual({ left: 20, right: 80 });
    expect(await grows()).toEqual([20, 80]);
  });

  it('collapses, opens and resizes a panel through its ref', async () => {
    const panelRef = createRef<ResizablePanelImperativeHandle>();
    await render(<Pair first={{ panelRef, collapsible: true, minSize: '10%' }} />);
    await layOut(401);

    await act(async () => panelRef.current?.collapse());
    expect(panelRef.current?.isCollapsed()).toBe(true);
    expect(await grows()).toEqual([0, 100]);

    await act(async () => panelRef.current?.expand());
    expect(await grows()).toEqual([25, 75]);

    await act(async () => panelRef.current?.resize('40%'));
    expect(panelRef.current?.getSize()).toEqual({ asPercentage: 40, inPixels: 160 });
  });

  describe('on the web', () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'web');
    });

    it('is a focusable separator across the group', async () => {
      await render(<Pair />);

      expect(handle().props.role).toBe('separator');
      expect(handle().props['aria-orientation']).toBe('vertical');
      expect(handle().props.focusable).toBe(true);
    });

    it('moves the handle with the arrow keys along the group, and as far as it goes with Home and End', async () => {
      await render(<Pair first={{ minSize: '10%', maxSize: '60%' }} />);
      await layOut(401);

      await press('ArrowRight');
      expect(await grows()).toEqual([30, 70]);
      await press('ArrowLeft');
      await press('ArrowLeft');
      expect(await grows()).toEqual([20, 80]);
      await press('ArrowDown');
      expect(await grows()).toEqual([20, 80]);
      await press('End');
      expect(await grows()).toEqual([60, 40]);
      await press('Home');
      expect(await grows()).toEqual([10, 90]);
    });

    it('takes the up and down arrows in a vertical group', async () => {
      await render(<Pair orientation="vertical" />);
      await layOut(401, 'y');

      await press('ArrowDown');
      expect(await grows()).toEqual([30, 70]);
      await press('ArrowUp');
      await press('ArrowUp');
      expect(await grows()).toEqual([20, 80]);
      await press('ArrowRight');
      expect(await grows()).toEqual([20, 80]);
    });

    it('collapses a collapsible panel before the handle with Enter, and opens it to its size before', async () => {
      await render(<Pair first={{ collapsible: true, minSize: '10%' }} />);
      await layOut(401);

      await press('Enter');
      expect(await grows()).toEqual([0, 100]);
      await press('Enter');
      expect(await grows()).toEqual([25, 75]);
    });

    it('moves focus to the next handle with F6, and back with Shift', async () => {
      const focused: string[] = [];
      // React Native's jest View has no `focus`, so each handle is given one that records it.
      const recording = (name: string) => (node: unknown) => {
        if (node) (node as { focus: () => void }).focus = () => focused.push(name);
      };
      await render(
        <ResizablePanelGroup>
          <ResizablePanel />
          <ResizableHandle testID="handle" elementRef={recording('first')} />
          <ResizablePanel />
          <ResizableHandle elementRef={recording('second')} />
          <ResizablePanel />
          <ResizableHandle elementRef={recording('third')} />
          <ResizablePanel />
        </ResizablePanelGroup>,
      );

      await press('F6');
      await press('F6', true);

      expect(focused).toEqual(['second', 'third']);
    });
  });

  describe('in text read right to left', () => {
    it('grows the panel before the handle as a finger moves left', async () => {
      await render(
        <DirectionProvider direction="rtl">
          <Pair />
        </DirectionProvider>,
      );
      await layOut(401);

      await drag(300, 260);

      expect(await grows()).toEqual([35, 65]);
    });

    it('runs the group from the right on a device the system lays out left to right', async () => {
      jest.spyOn(I18nManager, 'getConstants').mockReturnValue({
        ...I18nManager.getConstants(),
        isRTL: false,
      });
      await render(
        <DirectionProvider direction="rtl">
          <Pair />
        </DirectionProvider>,
      );

      expect(styleOf(screen.getByTestId('group')).flexDirection).toBe('row-reverse');
    });

    it("lays the group out in the platform's row where it already runs right to left", async () => {
      jest.replaceProperty(Platform, 'OS', 'web');
      await render(
        <DirectionProvider direction="rtl">
          <Pair />
        </DirectionProvider>,
      );

      expect(styleOf(screen.getByTestId('group')).flexDirection).toBe('row');
    });
  });
});
