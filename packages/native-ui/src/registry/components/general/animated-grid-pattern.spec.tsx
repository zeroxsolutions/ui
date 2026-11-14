import { act, fireEvent, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { AnimatedGridPattern } from './animated-grid-pattern';

const HIDDEN = { includeHiddenElements: true } as const;

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

/** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

/** Lays the grid out at 400 by 200. */
const layOut = () =>
  fireEvent(screen.getByTestId('grid', HIDDEN), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 200 } },
  });

const squares = () => screen.queryAllByTestId('grid-square', HIDDEN);

/** Where each lit cell sits. */
const placed = () => squares().map((square) => [square.props.x, square.props.y]);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('AnimatedGridPattern', () => {
  it('lights no cell before it has been laid out', async () => {
    reduceMotion(false);
    await render(<AnimatedGridPattern testID="grid" numSquares={10} />);
    await elapse(0);

    expect(squares()).toHaveLength(0);
  });

  it('lights numSquares cells inside its box once it has been laid out', async () => {
    reduceMotion(false);
    await render(<AnimatedGridPattern testID="grid" numSquares={10} />);
    await layOut();

    expect(squares()).toHaveLength(10);
    for (const [x, y] of placed()) {
      expect(x).toBeLessThan(400);
      expect(y).toBeLessThan(200);
    }
  });

  it('moves a cell to another once it has faded in and out', async () => {
    reduceMotion(false);
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    await render(<AnimatedGridPattern testID="grid" numSquares={1} duration={1} repeatDelay={0.5} />);
    await layOut();
    expect(placed()).toEqual([[1, 1]]);

    random.mockReturnValue(0.9);
    await elapse(2600);
    expect(placed()).toEqual([[361, 161]]);
  });

  it('draws its cells still at maxOpacity, never moving, when the person asked to reduce motion', async () => {
    reduceMotion(true);
    await render(<AnimatedGridPattern testID="grid" numSquares={4} maxOpacity={0.3} duration={1} />);
    await elapse(0);
    await layOut();
    const before = placed();

    await elapse(5000);
    expect(squares().map((square) => square.props.opacity)).toEqual([0.3, 0.3, 0.3, 0.3]);
    expect(placed()).toEqual(before);
  });

  it('is hidden from a screen reader, as decoration', async () => {
    reduceMotion(false);
    await render(<AnimatedGridPattern testID="grid" />);

    expect(isHiddenFromAccessibility(screen.getByTestId('grid', HIDDEN))).toBe(true);
  });
});
