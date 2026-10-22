import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { DirectionProvider } from './direction';
import { holdsMirrored } from './direction.testing';
import { Text } from './text';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
  type CarouselProps,
} from './carousel';

const SLIDES = 5;

function Slides({ count = SLIDES, ...props }: CarouselProps & { count?: number }) {
  return (
    <Carousel {...props}>
      <CarouselContent testID="row">
        {Array.from({ length: count }, (_, index) => (
          <CarouselItem key={index} testID={`slide-${index}`}>
            <Text>{index + 1}</Text>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

/**
 * Lays the row out `size` wide (or high), each slide `slide` long one after another, as a layout pass does;
 * the row starts 16px before the viewport, as its -ml-4 puts it.
 */
async function layOut(size: number, slide = size, axis: 'x' | 'y' = 'x', count = SLIDES): Promise<void> {
  const layout = (offset: number, length: number) =>
    axis === 'x' ? { x: offset, y: 0, width: length, height: 100 } : { x: 0, y: offset, width: 100, height: length };
  await fireEvent(screen.getByTestId('row'), 'layout', { nativeEvent: { layout: layout(-16, size) } });
  for (let index = 0; index < count; index += 1) {
    await fireEvent(screen.getByTestId(`slide-${index}`), 'layout', {
      nativeEvent: { layout: layout(index * slide, slide) },
    });
  }
}

/** Where the row has been moved to, once its animation has run; 0 for no move. */
async function translation(axis: 'translateX' | 'translateY' = 'translateX'): Promise<number> {
  await act(() => jest.advanceTimersByTimeAsync(1000));
  const moved = screen.getByTestId('row').parent;
  if (!moved) throw new Error('No moving layer');
  const transform = (getAnimatedStyle(moved) as { transform?: Record<string, number>[] }).transform ?? [];
  return (transform.find((entry) => axis in entry)?.[axis] ?? 0) + 0;
}

function previous() {
  return screen.getByRole('button', { name: 'Previous slide' });
}

function next() {
  return screen.getByRole('button', { name: 'Next slide' });
}

function touch(page: number, timestamp: number, axis: 'x' | 'y' = 'x') {
  return { nativeEvent: axis === 'x' ? { pageX: page, pageY: 0, timestamp } : { pageX: 0, pageY: page, timestamp } };
}

describe('Carousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('names its previous and next buttons, and disables previous on the first slide', async () => {
    await render(<Slides />);
    await layOut(300);

    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it('moves a slide at a time with its buttons, to the last one', async () => {
    await render(<Slides />);
    await layOut(300);

    await fireEvent.press(next());
    expect(await translation()).toBe(-300);
    expect(previous()).toBeEnabled();

    for (let i = 0; i < SLIDES; i += 1) await fireEvent.press(next());
    expect(await translation()).toBe(-1200);
    expect(next()).toBeDisabled();

    await fireEvent.press(previous());
    expect(await translation()).toBe(-900);
  });

  it('hands its api to setApi, with its snaps, the selected one and a select event', async () => {
    let api: CarouselApi | undefined;
    const onSelect = jest.fn();
    await render(
      <Slides
        setApi={(given) => {
          api = given;
          given?.on('select', onSelect);
        }}
      />,
    );
    await layOut(300);

    expect(api?.scrollSnapList()).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(api?.selectedScrollSnap()).toBe(0);
    await act(() => api?.scrollTo(3));

    expect(api?.selectedScrollSnap()).toBe(3);
    expect(api?.previousScrollSnap()).toBe(0);
    expect(api?.canScrollNext()).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(api, 'select');
    expect(await translation()).toBe(-900);
  });

  it('settles at once after a jump', async () => {
    let api: CarouselApi | undefined;
    const onSettle = jest.fn();
    await render(
      <Slides
        setApi={(given) => {
          api = given;
          given?.on('settle', onSettle);
        }}
      />,
    );
    await layOut(300);

    await act(() => api?.scrollTo(2, true));

    expect(onSettle).toHaveBeenCalledTimes(1);
    expect(onSettle).toHaveBeenCalledWith(api, 'settle');
  });

  it('reports its progress and the slides in view', async () => {
    let api: CarouselApi | undefined;
    await render(<Slides opts={{ align: 'start' }} setApi={(given) => (api = given)} />);
    await layOut(300, 120);

    expect(api?.scrollProgress()).toBe(0);
    expect(api?.slidesInView()).toEqual([0, 1, 2]);
    expect(api?.slidesNotInView()).toEqual([3, 4]);

    await act(() => api?.scrollTo(1, true));

    expect(api?.scrollProgress()).toBe(0.4);
    expect(api?.slidesInView()).toEqual([1, 2, 3]);
  });

  it('counts the slides either side of a centred slide as in view while any of them shows', async () => {
    let api: CarouselApi | undefined;
    await render(<Slides setApi={(given) => (api = given)} />);
    await layOut(300, 200);

    expect(api?.slidesInView()).toEqual([0, 1]);

    await act(() => api?.scrollTo(2, true));

    expect(api?.slidesInView()).toEqual([1, 2, 3]);
    expect(api?.slidesNotInView()).toEqual([0, 4]);
  });

  it('tells its listeners when a new layout reinitialises it, and that it resized', async () => {
    let api: CarouselApi | undefined;
    const events: string[] = [];
    await render(
      <Slides
        setApi={(given) => {
          api = given;
          given?.on('init', (_, event) => events.push(event));
          given?.on('reInit', (_, event) => events.push(event));
          given?.on('resize', (_, event) => events.push(event));
        }}
      />,
    );
    await layOut(300);
    expect(events[0]).toBe('init');
    events.length = 0;

    // A turned phone: the view widens and the slides stay as they were.
    await fireEvent(screen.getByTestId('row'), 'layout', {
      nativeEvent: { layout: { x: -16, y: 0, width: 400, height: 100 } },
    });

    expect(api).toBeDefined();
    expect(events).toEqual(['reInit', 'resize']);
  });

  it('follows a swipe and settles on the next slide', async () => {
    await render(<Slides />);
    await layOut(300);
    const viewport = screen.getByTestId('row').parent?.parent;
    if (!viewport) throw new Error('No viewport');

    expect(viewport.props.onMoveShouldSetResponderCapture(touch(200, 10))).toBe(false);
    await fireEvent(viewport, 'responderGrant', touch(250, 0));
    await fireEvent(viewport, 'responderMove', touch(150, 100));
    expect(await translation()).toBe(-100);
    await fireEvent(viewport, 'responderRelease', touch(140, 200));

    expect(await translation()).toBe(-300);
    expect(previous()).toBeEnabled();
  });

  it('springs back from a short slow swipe', async () => {
    await render(<Slides />);
    await layOut(300);
    const viewport = screen.getByTestId('row').parent?.parent;
    if (!viewport) throw new Error('No viewport');

    await fireEvent(viewport, 'responderGrant', touch(250, 0));
    await fireEvent(viewport, 'responderMove', touch(230, 500));
    await fireEvent(viewport, 'responderRelease', touch(230, 1000));

    expect(await translation()).toBe(0);
  });

  it('snaps to the slides that fit, three to a view, when aligned at the start', async () => {
    let api: CarouselApi | undefined;
    await render(<Slides opts={{ align: 'start' }} setApi={(given) => (api = given)} />);
    await layOut(300, 100);

    expect(api?.scrollSnapList()).toHaveLength(3);
    await fireEvent.press(next());
    await fireEvent.press(next());
    expect(await translation()).toBe(-200);
    expect(next()).toBeDisabled();
  });

  it('wraps from the last slide to the first with loop', async () => {
    await render(<Slides opts={{ loop: true }} />);
    await layOut(300);

    expect(previous()).toBeEnabled();
    for (let i = 0; i < SLIDES; i += 1) await fireEvent.press(next());

    expect(await translation()).toBe(-1500);
    // The first slide is drawn after the last, where the row has been moved to.
    const first = screen.getByTestId('slide-0').children[0];
    if (typeof first === 'string') throw new Error('No slide content');
    expect(first).toHaveAnimatedStyle({ transform: [{ translateX: 1500 }] });
  });

  it('moves along y when vertical', async () => {
    await render(<Slides orientation="vertical" />);
    await layOut(200, 200, 'y');

    await fireEvent.press(next());

    expect(await translation('translateY')).toBe(-200);
  });

  it('moves with the arrow keys', async () => {
    await render(<Slides testID="carousel" />);
    await layOut(300);

    await fireEvent(screen.getByTestId('carousel'), 'keyDownCapture', {
      nativeEvent: { key: 'ArrowRight' },
      preventDefault: jest.fn(),
    });

    expect(await translation()).toBe(-300);
  });

  it('runs from the right when text reads right to left: a swipe right and the left arrow move it on', async () => {
    await render(
      <DirectionProvider direction="rtl">
        <Slides testID="carousel" />
      </DirectionProvider>,
    );
    await layOut(300);
    const viewport = screen.getByTestId('row').parent?.parent;
    if (!viewport) throw new Error('No viewport');
    expect(viewport).toHaveStyle({ transform: [{ scaleX: -1 }] });

    await fireEvent(viewport, 'responderGrant', touch(50, 0));
    await fireEvent(viewport, 'responderMove', touch(150, 100));
    expect(await translation()).toBe(-100);
    await fireEvent(viewport, 'responderRelease', touch(160, 200));
    expect(await translation()).toBe(-300);

    await fireEvent(screen.getByTestId('carousel'), 'keyDownCapture', {
      nativeEvent: { key: 'ArrowLeft' },
      preventDefault: jest.fn(),
    });
    expect(await translation()).toBe(-600);
  });

  it('mirrors its previous and next chevrons when text reads right to left, and only then', async () => {
    await render(<Slides />);
    expect(holdsMirrored(previous())).toBe(false);

    await render(
      <DirectionProvider direction="rtl">
        <Slides />
      </DirectionProvider>,
    );

    expect(holdsMirrored(previous())).toBe(true);
    expect(holdsMirrored(next())).toBe(true);
  });

  it('jumps when the system asks for reduced motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<Slides />);
    await layOut(300);

    await fireEvent.press(next());
    // A frame, well short of the animation's 300ms.
    await act(() => jest.advanceTimersByTimeAsync(16));

    const moved = screen.getByTestId('row').parent;
    if (!moved) throw new Error('No moving layer');
    expect(getAnimatedStyle(moved)).toEqual({ transform: [{ translateX: -300 }] });
  });

  it("draws round outline buttons in Vega's style", async () => {
    await render(<Slides />);

    expect(emittedClasses(next().props.className)).toEqual(
      expect.arrayContaining(['rounded-full', 'border', 'border-border']),
    );
  });
});
