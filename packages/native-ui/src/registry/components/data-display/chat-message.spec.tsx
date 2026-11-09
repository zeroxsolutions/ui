import { isHiddenFromAccessibility, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { Bubble, BubbleContent } from '../../ui/bubble';
import { MessageContent, MessageHeader } from '../../ui/message';
import { ChatMessage, ChatMessageAccent } from './chat-message';

const HIDDEN = { includeHiddenElements: true } as const;

function Example({ streaming }: { streaming?: boolean }) {
  return (
    <ChatMessage testID="row" streaming={streaming}>
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

  it('aligns through Message', async () => {
    await render(
      <ChatMessage testID="row" align="end">
        <MessageContent />
      </ChatMessage>,
    );

    expect(emittedClasses(screen.getByTestId('row').props.className)).toContain('flex-row-reverse');
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

  it("draws the accent as a primary line 12px before the row's leading edge", async () => {
    await render(<Example streaming />);
    const accent = screen.getByTestId('accent', HIDDEN);

    expect(emittedClasses(accent.props.className)).toEqual(
      expect.arrayContaining(['bg-primary', 'absolute', 'inset-y-0', 'w-0.5']),
    );
    expect(StyleSheet.flatten(accent.props.style)).toEqual({ start: -12 });
  });

  it("takes the caller's colour over the primary one", async () => {
    await render(
      <ChatMessage streaming>
        <ChatMessageAccent testID="accent" className="bg-chart-2" />
      </ChatMessage>,
    );

    const classes = emittedClasses(screen.getByTestId('accent', HIDDEN).props.className);
    expect(classes).toContain('bg-chart-2');
    expect(classes).not.toContain('bg-primary');
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
