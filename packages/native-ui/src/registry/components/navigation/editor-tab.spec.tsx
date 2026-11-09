import { render, screen, userEvent } from '@testing-library/react-native';
import { ItemActions, ItemContent } from '../../ui/item';
import { EditorTab, EditorTabCloseButton, EditorTabTitle, type EditorTabProps } from './editor-tab';

function Example({ onClose, ...props }: EditorTabProps & { onClose?: () => void }) {
  return (
    <EditorTab {...props}>
      <ItemContent>
        <EditorTabTitle>page.tsx</EditorTabTitle>
      </ItemContent>
      <ItemActions>
        <EditorTabCloseButton aria-label="Close page.tsx" onPress={onClose} />
      </ItemActions>
    </EditorTab>
  );
}

describe('EditorTab', () => {
  it('shows the close button at all times', async () => {
    await render(<Example />);
    expect(screen.getByRole('button', { name: 'Close page.tsx' })).toBeOnTheScreen();

    await screen.rerender(<Example dirty />);
    expect(screen.getByRole('button', { name: 'Close page.tsx' })).toBeOnTheScreen();
  });

  it('shows the unsaved mark before the close button on a dirty tab that is not active', async () => {
    await render(<Example />);
    expect(screen.queryByRole('img', { name: 'Unsaved changes' })).toBeNull();

    await screen.rerender(<Example dirty />);
    expect(screen.getByRole('img', { name: 'Unsaved changes' })).toBeOnTheScreen();

    await screen.rerender(<Example dirty active />);
    expect(screen.queryByRole('img', { name: 'Unsaved changes' })).toBeNull();
  });

  it('names the close button "Close" when the caller gives no label', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    await render(
      <EditorTab>
        <EditorTabCloseButton onPress={onClose} />
      </EditorTab>,
    );

    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
