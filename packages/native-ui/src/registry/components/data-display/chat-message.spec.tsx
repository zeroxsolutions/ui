import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Bubble, BubbleContent } from '../../ui/bubble';
import { MessageContent, MessageHeader } from '../../ui/message';
import { ChatMessage, ChatMessageAccent } from './chat-message';

const HIDDEN = { includeHiddenElements: true } as const;

function Example({ streaming }: { streaming?: boolean }) {
  return (
    <ChatMessage streaming={streaming}>
      <ChatMessageAccent testID="accent" />
      <MessageContent>
        <MessageHeader>Assistant</MessageHeader>
        <Bubble variant="ghost">
          <BubbleContent>Looking now.</BubbleContent>
        </Bubble>
      </MessageContent>
    </ChatMessage>
  );
}

describe('ChatMessage', () => {
  it('draws the Message parts it is given', async () => {
    await render(<Example />);

    expect(screen.getByText('Assistant')).toBeOnTheScreen();
    expect(screen.getByText('Looking now.')).toBeOnTheScreen();
  });

  it('draws the accent only while the row streams', async () => {
    await render(<Example />);
    expect(screen.queryByTestId('accent', HIDDEN)).toBeNull();

    await screen.rerender(<Example streaming />);
    expect(screen.getByTestId('accent', HIDDEN)).toBeOnTheScreen();
  });

  it('keeps the accent out of the accessibility tree', async () => {
    await render(<Example streaming />);

    expect(isHiddenFromAccessibility(screen.getByTestId('accent', HIDDEN))).toBe(true);
  });

  it('passes the caller style through to the row', async () => {
    await render(
      <ChatMessage testID="row" style={{ opacity: 0.5 }}>
        <MessageContent />
      </ChatMessage>,
    );

    expect(StyleSheet.flatten(screen.getByTestId('row').props.style)).toMatchObject({ opacity: 0.5 });
  });
});
