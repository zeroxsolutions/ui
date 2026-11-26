import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import { MessageContext } from '../lib/message-context';
import { Bubble, BubbleContent, BubbleReactions } from './bubble';

describe('Bubble', () => {
  it('tells the message it sits in while it is a ghost bubble', async () => {
    const countGhost = jest.fn();
    const { unmount } = await render(
      <MessageContext.Provider value={{ align: 'start', countGhost }}>
        <Bubble variant="ghost">
          <BubbleContent>Thinking it through.</BubbleContent>
        </Bubble>
        <Bubble>
          <BubbleContent>Framed.</BubbleContent>
        </Bubble>
      </MessageContext.Provider>,
    );

    expect(countGhost.mock.calls).toEqual([[1]]);
    await unmount();
    expect(countGhost.mock.calls).toEqual([[1], [-1]]);
  });

  it('renders its child as the content with asChild, so the bubble takes a press', async () => {
    const onPress = jest.fn();
    await render(
      <Bubble variant="outline">
        <BubbleContent asChild>
          <Pressable role="button" onPress={onPress}>
            Show the full diff
          </Pressable>
        </BubbleContent>
      </Bubble>,
    );

    const button = screen.getByRole('button', { name: 'Show the full diff' });
    await userEvent.setup().press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('BubbleReactions', () => {
  it('reads as one image named by its label once a simulated layout places it', async () => {
    await render(
      <Bubble variant="muted">
        <BubbleContent>Nice.</BubbleContent>
        <BubbleReactions role="img" aria-label="Reaction: thumbs up" testID="reactions">
          {'\u{1F44D}'}
        </BubbleReactions>
      </Bubble>,
    );
    await fireEvent(screen.getByTestId('reactions', { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 32, height: 24 } },
    });

    const reactions = screen.getByRole('img', { name: 'Reaction: thumbs up' });
    expect(reactions.props.accessible).toBe(true);
  });

  it.each([
    ['bottom', 'end', 0.75],
    ['top', 'start', -0.75],
  ] as const)(
    'overlaps the %s edge at the %s by three quarters of the height a simulated layout reports',
    async (side, align, share) => {
      await render(
        <Bubble>
          <BubbleContent>Nice.</BubbleContent>
          <BubbleReactions side={side} align={align} testID="reactions">
            {'\u{1F44D}'}
          </BubbleReactions>
        </Bubble>,
      );
      const reactions = screen.getByTestId('reactions', { includeHiddenElements: true });

      await fireEvent(reactions, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 32, height: 24 } } });
      expect(screen.getByTestId('reactions')).toHaveStyle({ transform: [{ translateY: 24 * share }] });
    },
  );
});

describe('BubbleReactions with a transform of its own', () => {
  it("keeps the overlap a simulated layout sets and applies the caller's transform after it", async () => {
    await render(
      <Bubble>
        <BubbleContent>Nice.</BubbleContent>
        <BubbleReactions testID="reactions" style={{ transform: [{ scale: 1.5 }] }}>
          {'\u{1F44D}'}
        </BubbleReactions>
      </Bubble>,
    );
    await fireEvent(screen.getByTestId('reactions', { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 32, height: 24 } },
    });

    expect(screen.getByTestId('reactions')).toHaveStyle({ transform: [{ translateY: 18 }, { scale: 1.5 }] });
  });

  it('keeps the overlap a simulated layout sets before a transform given as a string', async () => {
    await render(
      <Bubble>
        <BubbleContent>Nice.</BubbleContent>
        <BubbleReactions testID="reactions" style={{ transform: 'rotate(5deg)' }}>
          {'\u{1F44D}'}
        </BubbleReactions>
      </Bubble>,
    );
    await fireEvent(screen.getByTestId('reactions', { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 32, height: 24 } },
    });

    expect(screen.getByTestId('reactions')).toHaveStyle({ transform: 'translateY(18px) rotate(5deg)' });
  });
});
