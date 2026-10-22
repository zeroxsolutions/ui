import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Platform, Pressable } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { MessageContext } from '../lib/message-context';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from './bubble';

function classesOf(className: string | undefined): string[] {
  return emittedClasses(className);
}

describe('Bubble', () => {
  it('draws its content on the primary colour, at the start of the row, by default', async () => {
    await render(
      <Bubble testID="bubble">
        <BubbleContent testID="content">Hey there! what's up?</BubbleContent>
      </Bubble>,
    );

    expect(classesOf(screen.getByTestId('bubble').props.className)).toEqual(
      expect.arrayContaining(['self-start', 'max-w-[80%]']),
    );
    expect(classesOf(screen.getByTestId('content').props.className)).toEqual(
      expect.arrayContaining(['bg-primary', 'rounded-xl', 'px-3', 'py-2']),
    );
    expect(classesOf(screen.getByText("Hey there! what's up?").props.className)).toEqual(
      expect.arrayContaining(['text-primary-foreground', 'text-sm']),
    );
  });

  it.each([
    ['secondary', 'bg-secondary'],
    ['muted', 'bg-muted'],
    ['tinted', 'bg-primary/10'],
    ['outline', 'border-border'],
    ['destructive', 'bg-destructive/10'],
  ] as const)('draws the %s variant with %s', async (variant, background) => {
    await render(
      <Bubble variant={variant}>
        <BubbleContent testID="content">Hello</BubbleContent>
      </Bubble>,
    );

    expect(classesOf(screen.getByTestId('content').props.className)).toContain(background);
  });

  it('lets a ghost bubble take the full width, with no frame around its content', async () => {
    await render(
      <Bubble variant="ghost" testID="bubble">
        <BubbleContent testID="content">An answer with no frame.</BubbleContent>
      </Bubble>,
    );

    expect(classesOf(screen.getByTestId('bubble').props.className)).toContain('max-w-full');
    expect(classesOf(screen.getByTestId('content').props.className)).toEqual(
      expect.arrayContaining(['bg-transparent', 'p-0', 'rounded-none']),
    );
  });

  it('moves an end-aligned bubble and its content to the end of the row', async () => {
    await render(
      <Bubble align="end" testID="bubble">
        <BubbleContent testID="content">Sure.</BubbleContent>
      </Bubble>,
    );

    expect(classesOf(screen.getByTestId('bubble').props.className)).toContain('self-end');
    expect(classesOf(screen.getByTestId('content').props.className)).toContain('self-end');
  });

  it('follows the side of the message it sits in', async () => {
    await render(
      <MessageContext.Provider value={{ align: 'end', countGhost: () => undefined }}>
        <Bubble testID="bubble">
          <BubbleContent>Deploying to prod real quick.</BubbleContent>
        </Bubble>
      </MessageContext.Provider>,
    );

    expect(classesOf(screen.getByTestId('bubble').props.className)).toContain('self-end');
  });

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
    expect(classesOf(button.props.className)).toEqual(expect.arrayContaining(['bg-background', 'border-border']));
  });

  describe('on the web', () => {
    const os = Platform.OS;
    beforeEach(() => {
      Platform.OS = 'web';
    });
    afterEach(() => {
      Platform.OS = os;
    });

    /** A focus event whose target answers `:focus-visible` with `visible`, as a browser's does. */
    const focusFrom = (visible: boolean): object => ({
      target: { matches: (selector: string) => selector === ':focus-visible' && visible },
    });

    it('rings pressable content while it holds keyboard focus', async () => {
      await render(
        <Bubble>
          <BubbleContent asChild>
            <Pressable role="button">Open</Pressable>
          </BubbleContent>
        </Bubble>,
      );

      await fireEvent(screen.getByRole('button'), 'focus', focusFrom(true));
      expect(classesOf(screen.getByRole('button').props.className)).toContain('border-ring');

      await fireEvent(screen.getByRole('button'), 'blur');
      expect(classesOf(screen.getByRole('button').props.className)).not.toContain('border-ring');
    });

    it('draws no ring after a mouse press focuses it, which comes before the press, and rings the next Tab', async () => {
      await render(
        <Bubble>
          <BubbleContent asChild>
            <Pressable role="button">Open</Pressable>
          </BubbleContent>
        </Bubble>,
      );

      await fireEvent(screen.getByRole('button'), 'focus', focusFrom(false));
      await fireEvent(screen.getByRole('button'), 'pressIn');
      await fireEvent(screen.getByRole('button'), 'pressOut');
      expect(classesOf(screen.getByRole('button').props.className)).not.toContain('border-ring');

      await fireEvent(screen.getByRole('button'), 'blur');
      await fireEvent(screen.getByRole('button'), 'focus', focusFrom(true));
      expect(classesOf(screen.getByRole('button').props.className)).toContain('border-ring');
    });
  });
});

describe('BubbleReactions', () => {
  it('reads as one image named by its label', async () => {
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
    ['bottom', 'end', ['bottom-0', 'right-3'], 0.75],
    ['top', 'start', ['top-0', 'left-3'], -0.75],
  ] as const)(
    'overlaps the %s edge at the %s, by three quarters of its own height',
    async (side, align, placed, share) => {
      await render(
        <Bubble>
          <BubbleContent>Nice.</BubbleContent>
          <BubbleReactions side={side} align={align} testID="reactions">
            {'\u{1F44D}'}
          </BubbleReactions>
        </Bubble>,
      );
      const reactions = screen.getByTestId('reactions', { includeHiddenElements: true });

      expect(classesOf(reactions.props.className)).toEqual(
        expect.arrayContaining(['absolute', 'border-[3px]', 'border-card', ...placed]),
      );
      await fireEvent(reactions, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 32, height: 24 } } });
      expect(screen.getByTestId('reactions')).toHaveStyle({ transform: [{ translateY: 24 * share }] });
    },
  );
});

describe('BubbleReactions with a transform of its own', () => {
  it("keeps the overlap and applies the caller's transform after it", async () => {
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

  it('keeps the overlap before a transform given as a string', async () => {
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

describe('BubbleGroup', () => {
  it('stacks its bubbles with a gap', async () => {
    await render(
      <BubbleGroup testID="group">
        <Bubble>
          <BubbleContent>One</BubbleContent>
        </Bubble>
      </BubbleGroup>,
    );

    expect(classesOf(screen.getByTestId('group').props.className)).toEqual(
      expect.arrayContaining(['flex-col', 'gap-2']),
    );
  });
});
