import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import { emittedClasses } from '../../build/slot-tokens.testing';
import { Bubble, BubbleContent } from './bubble';
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from './message';
import { Text } from './text';

function classesOf(testID: string): string[] {
  return emittedClasses(screen.getByTestId(testID).props.className);
}

describe('Message', () => {
  it('lays its avatar and content out in a row, the content taking the width left', async () => {
    await render(
      <Message testID="message">
        <MessageAvatar testID="avatar">
          <Text>R</Text>
        </MessageAvatar>
        <MessageContent testID="content">
          <Bubble>
            <BubbleContent>It's 4:55 PM. On a Friday.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>,
    );

    expect(classesOf('message')).toEqual(expect.arrayContaining(['flex-row', 'gap-2']));
    expect(classesOf('message')).not.toContain('flex-row-reverse');
    expect(classesOf('avatar')).toEqual(expect.arrayContaining(['self-end', 'rounded-full', 'min-w-8']));
    expect(classesOf('avatar')).not.toContain('-translate-y-8');
    expect(classesOf('content')).toEqual(expect.arrayContaining(['flex-1', 'gap-2.5']));
  });

  it('puts an end-aligned message on the other side, its parts at the end of the content', async () => {
    await render(
      <Message align="end" testID="message">
        <MessageContent testID="content">
          <Bubble testID="bubble">
            <BubbleContent>Deploying to prod real quick.</BubbleContent>
          </Bubble>
          <MessageFooter testID="footer">Delivered</MessageFooter>
        </MessageContent>
      </Message>,
    );

    expect(classesOf('message')).toContain('flex-row-reverse');
    expect(classesOf('content')).toContain('items-end');
    expect(classesOf('bubble')).toContain('self-end');
    expect(classesOf('footer')).toContain('justify-end');
  });

  it('lifts the avatar level with the bubble while the message has a footer', async () => {
    function WithFooter(): ReactNode {
      const [footer, setFooter] = useState(true);
      return (
        <Message>
          <MessageAvatar testID="avatar" />
          <MessageContent>
            <Pressable role="button" onPress={() => setFooter(false)}>
              <Text>Hide footer</Text>
            </Pressable>
            {footer ? <MessageFooter>Delivered</MessageFooter> : null}
          </MessageContent>
        </Message>
      );
    }
    await render(<WithFooter />);

    expect(classesOf('avatar')).toContain('-translate-y-8');

    await fireEvent.press(screen.getByRole('button', { name: 'Hide footer' }));
    expect(classesOf('avatar')).not.toContain('-translate-y-8');
  });

  it('draws its header and footer small and muted, inset to line up with a framed bubble', async () => {
    await render(
      <Message>
        <MessageContent>
          <MessageHeader testID="header">Rabbit</MessageHeader>
          <Bubble>
            <BubbleContent>Hi</BubbleContent>
          </Bubble>
          <MessageFooter testID="footer">Read</MessageFooter>
        </MessageContent>
      </Message>,
    );

    expect(classesOf('header')).toContain('px-3');
    expect(classesOf('footer')).toContain('px-3');
    expect(emittedClasses(screen.getByText('Rabbit').props.className)).toEqual(
      expect.arrayContaining(['text-xs', 'text-muted-foreground', 'font-sans-medium']),
    );
  });

  it('drops the inset of its header and footer while it holds a ghost bubble', async () => {
    await render(
      <Message>
        <MessageContent>
          <MessageHeader testID="header">Assistant</MessageHeader>
          <Bubble variant="ghost">
            <BubbleContent>An answer with no frame.</BubbleContent>
          </Bubble>
          <MessageFooter testID="footer">Copied</MessageFooter>
        </MessageContent>
      </Message>,
    );

    expect(classesOf('header')).toContain('px-0');
    expect(classesOf('footer')).toContain('px-0');
  });
});

describe('MessageGroup', () => {
  it('stacks its messages with a gap', async () => {
    await render(
      <MessageGroup testID="group">
        <Message />
      </MessageGroup>,
    );

    expect(classesOf('group')).toEqual(expect.arrayContaining(['flex-col', 'gap-2']));
  });
});
