import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import { emittedClasses } from '../../../build/slot-tokens.testing';
import { ItemActions, ItemContent } from '../../ui/item';
import { EditorTab, EditorTabCloseButton, EditorTabTitle, type EditorTabProps } from './editor-tab';

function Example({ onClose, ...props }: EditorTabProps & { onClose?: () => void }) {
  return (
    <EditorTab testID="tab" {...props}>
      <ItemContent>
        <EditorTabTitle>page.tsx</EditorTabTitle>
      </ItemContent>
      <ItemActions>
        <EditorTabCloseButton aria-label="Close page.tsx" onPress={onClose} />
      </ItemActions>
    </EditorTab>
  );
}

function titleClasses(): string[] {
  return emittedClasses(screen.getByText('page.tsx').props.className);
}

describe('EditorTab', () => {
  it.each([
    ['vega', 'rounded-md', 'px-2.5'],
    ['lyra', 'rounded-none', 'px-2.5'],
  ] as const)('is an outline extra-small Item in %s, as wide as its content', async (style, radius, padding) => {
    await render(<Example />);

    const classes = emittedClasses(screen.getByTestId('tab').props.className, style);
    expect(classes).toEqual(expect.arrayContaining(['border-border', radius, padding, 'w-auto', 'self-start']));
    expect(classes).not.toContain('w-full');
  });

  it('mutes its title until the tab is active', async () => {
    await render(<Example />);
    expect(titleClasses()).toContain('text-muted-foreground');

    await screen.rerender(<Example active />);
    expect(titleClasses()).toContain('text-foreground');
    expect(titleClasses()).not.toContain('text-muted-foreground');
  });

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

  it('closes without also activating the tab', async () => {
    const onClose = jest.fn();
    const onActivate = jest.fn();
    await render(
      <EditorTab asChild>
        <Pressable onPress={onActivate}>
          <ItemActions>
            <EditorTabCloseButton onPress={onClose} />
          </ItemActions>
        </Pressable>
      </EditorTab>,
    );
    const stopPropagation = jest.fn();

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }), { stopPropagation });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
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
