import { render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Skeleton } from './skeleton.uniwind';

// Uniwind's HOC resolves className to style, which the jest run has no engine for; it only needs to pass props on.
jest.mock('uniwind', () => ({ withUniwind: (component: unknown) => component }));

describe('Skeleton on Uniwind', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is a muted rounded block', async () => {
    await render(<Skeleton testID="skeleton" className="h-4 w-40" />);
    const classes = emittedClasses(screen.getByTestId('skeleton').props.className);

    expect(classes).toEqual(expect.arrayContaining(['bg-muted', 'rounded-md', 'h-4', 'w-40']));
    expect(classes).not.toContain('animate-pulse');
  });

  it('loops a fade to half opacity and back, which Uniwind does not run as animate-pulse', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const loop = jest.spyOn(Animated, 'loop');
    await render(<Skeleton testID="skeleton" />);

    expect(loop).toHaveBeenCalledTimes(1);
    expect(timing.mock.calls.map(([, config]) => [config.toValue, config.duration])).toEqual([
      [0.5, 1000],
      [1, 1000],
    ]);
  });

  it('stops the loop when it unmounts', async () => {
    const stop = jest.fn();
    jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop, reset: jest.fn() });
    const { unmount } = await render(<Skeleton testID="skeleton" />);

    await unmount();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
