import { render, screen, userEvent } from '@testing-library/react-native';
import { ItemActions, ItemContent } from '../../ui/item';
import { EditorTab, EditorTabCloseButton, EditorTabTitle, type EditorTabProps } from './editor-tab';
import { focus, handleOf } from '../../icons/animated-icon.testing';
import { XIcon } from '../../icons/lucide/x-icon';

jest.mock('../../icons/lucide/x-icon', () =>
  jest.requireActual('../../icons/animated-icon.testing').animatedIconModule('x-icon'),
);

beforeEach(() => {
  jest.clearAllMocks();
});

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

describe('EditorTabCloseButton motion', () => {
  it('starts its icon on press-in and on focus', async () => {
    const onPressIn = jest.fn();
    const onFocus = jest.fn();
    await render(
      <EditorTab>
        <ItemActions>
          <EditorTabCloseButton aria-label="Close page.tsx" onPressIn={onPressIn} onFocus={onFocus} />
        </ItemActions>
      </EditorTab>,
    );
    const control = screen.getByRole('button', { name: 'Close page.tsx' });

    await userEvent.setup().press(control);
    await focus(control);

    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(handleOf(XIcon).startAnimation).toHaveBeenCalledTimes(2);
    expect(handleOf(XIcon).stopAnimation).not.toHaveBeenCalled();
  });
});
