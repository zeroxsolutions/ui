import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { ItemContent, ItemGroup, ItemTitle } from '../../ui/item';
import { ChatSuggestionItem, type ChatSuggestionItemProps } from './chat-suggestion-item';

function Example(props: Partial<ChatSuggestionItemProps>) {
  return (
    <ItemGroup>
      <ChatSuggestionItem testID="item" prompt="Summarise this document" {...props}>
        <ItemContent>
          <ItemTitle>Summarise</ItemTitle>
        </ItemContent>
      </ChatSuggestionItem>
    </ItemGroup>
  );
}

function itemClasses(style?: 'vega' | 'lyra'): string[] {
  return emittedClasses(screen.getByTestId('item').props.className, style);
}

describe('ChatSuggestionItem', () => {
  it('is a button named by its content that hands its prompt over when pressed', async () => {
    const user = userEvent.setup();
    const onSelectPrompt = jest.fn();
    await render(<Example onSelectPrompt={onSelectPrompt} />);

    await user.press(screen.getByRole('button', { name: 'Summarise' }));

    expect(onSelectPrompt).toHaveBeenCalledWith('Summarise this document');
  });

  it("runs the caller's onPress before handing the prompt over", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    await render(
      <Example onPress={() => calls.push('press')} onSelectPrompt={(prompt) => calls.push(`prompt:${prompt}`)} />,
    );

    await user.press(screen.getByRole('button', { name: 'Summarise' }));

    expect(calls).toEqual(['press', 'prompt:Summarise this document']);
  });

  it('does not hand the prompt over when the caller prevents the default', async () => {
    const onSelectPrompt = jest.fn();
    await render(<Example onPress={(event) => event.preventDefault()} onSelectPrompt={onSelectPrompt} />);
    let prevented = false;

    await fireEvent.press(screen.getByRole('button', { name: 'Summarise' }), {
      preventDefault: () => {
        prevented = true;
      },
      isDefaultPrevented: () => prevented,
    });

    expect(onSelectPrompt).not.toHaveBeenCalled();
  });

  it('is disabled with no select handler, announced as such', async () => {
    await render(<Example />);

    expect(screen.getByRole('button', { name: 'Summarise' })).toBeDisabled();
    expect(itemClasses()).not.toContain('active:bg-muted');
  });

  it('follows disabled over the presence of a handler', async () => {
    await render(<Example onSelectPrompt={jest.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Summarise' })).toBeDisabled();

    await screen.rerender(<Example disabled={false} />);
    expect(screen.getByRole('button', { name: 'Summarise' })).toBeEnabled();
  });

  it.each([
    ['vega', 'rounded-md'],
    ['lyra', 'rounded-none'],
  ] as const)('is a small Item in %s, %s, muted while held down and enabled', async (style, radius) => {
    await render(<Example onSelectPrompt={jest.fn()} />);

    expect(itemClasses(style)).toEqual(expect.arrayContaining(['flex-row', radius, 'active:bg-muted']));
  });

  it('passes the caller props through', async () => {
    await render(<Example accessibilityHint="Sends this prompt" />);

    expect(screen.getByTestId('item').props.accessibilityHint).toBe('Sends this prompt');
  });
});
