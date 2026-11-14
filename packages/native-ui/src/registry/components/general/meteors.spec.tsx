import { act, isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { Meteors } from './meteors';

const HIDDEN = { includeHiddenElements: true } as const;

/** Answers the reduce-motion setting with `enabled`. */
function reduceMotion(enabled: boolean): void {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(enabled);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(() => ({ remove: jest.fn() }));
}

/** Lets `ms` pass on Jest's clock, running the animation frames due in it. */
const elapse = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Meteors', () => {
  it('draws as many meteors as number asks for', async () => {
    reduceMotion(false);
    await render(<Meteors number={7} />);
    await elapse(0);

    expect(screen.getAllByTestId('meteor', HIDDEN)).toHaveLength(7);
  });

  it('starts each meteor along the top, at a share of the width', async () => {
    reduceMotion(false);
    await render(<Meteors number={5} />);
    await elapse(0);

    for (const meteor of screen.getAllByTestId('meteor', HIDDEN)) {
      expect(meteor).toHaveStyle({ top: '-5%' });
      expect(String((meteor.props.style as { left: string }[])[0].left)).toMatch(/^\d+(\.\d+)?%$/);
    }
  });

  it('carries each meteor along its path as it falls', async () => {
    reduceMotion(false);
    await render(<Meteors number={1} minDelay={0} maxDelay={0} minDuration={2} maxDuration={2} />);
    await elapse(0);
    const meteor = screen.getByTestId('meteor', HIDDEN);

    await elapse(1000);
    expect(meteor).toHaveAnimatedStyle({ opacity: 1, transform: [{ rotate: '215deg' }, { translateX: -250 }] });
  });

  it('is hidden from a screen reader, as decoration', async () => {
    reduceMotion(false);
    await render(<Meteors testID="meteors" />);

    expect(isHiddenFromAccessibility(screen.getByTestId('meteors', HIDDEN))).toBe(true);
  });

  it('draws no meteor when the person asked to reduce motion', async () => {
    reduceMotion(true);
    await render(<Meteors number={7} />);
    await elapse(0);

    expect(screen.queryAllByTestId('meteor', HIDDEN)).toHaveLength(0);
  });
});
