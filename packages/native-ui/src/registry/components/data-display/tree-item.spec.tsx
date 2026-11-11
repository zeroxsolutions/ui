import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button } from '../../ui/button';
import { Text } from '../../ui/text';
import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput, TreeItemTrigger } from './tree-item';

// React Native's jest mock gives every TextInput one shared `blur` mock, so its calls carry over between tests.
afterEach(() => {
  jest.clearAllMocks();
});

/** A folder row its trigger opens and closes, as the demo composes it. */
function Folder({ onToggle, onSelect }: { onToggle?: () => void; onSelect?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <TreeItem expanded={open} asChild>
      <Pressable aria-label="src row" onPress={onSelect}>
        <TreeItemIndent depth={0}>
          <TreeItemTrigger
            aria-label="Toggle src"
            onPress={() => {
              onToggle?.();
              setOpen((current) => !current);
            }}
          />
        </TreeItemIndent>
        <TreeItemLabel>src</TreeItemLabel>
      </Pressable>
    </TreeItem>
  );
}

describe('TreeItem', () => {
  it('draws the name and the controls the consumer composes, and hands a press on the name to the label', async () => {
    const user = userEvent.setup();
    const onActivate = jest.fn();
    await render(
      <TreeItem leaf>
        <TreeItemIndent depth={1} />
        <TreeItemLabel onPress={onActivate}>Layer 1</TreeItemLabel>
        <Button aria-label="Hide" />
      </TreeItem>,
    );

    await user.press(screen.getByText('Layer 1'));

    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0]).toHaveProperty('nativeEvent');
    expect(screen.getByRole('button', { name: 'Hide' })).toBeOnTheScreen();
  });

  it('offers no control on a leaf row', async () => {
    await render(
      <TreeItem leaf>
        <TreeItemIndent depth={1} />
        <TreeItemLabel>index.ts</TreeItemLabel>
      </TreeItem>,
    );

    expect(screen.getByText('index.ts')).toBeOnTheScreen();
    expect(screen.queryAllByRole('button')).toEqual([]);
  });
});

describe('TreeItemTrigger', () => {
  it('runs its onPress', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();
    await render(<Folder onToggle={onToggle} />);

    await user.press(screen.getByRole('button', { name: 'Toggle src' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("announces the row's expanded state", async () => {
    const user = userEvent.setup();
    await render(<Folder />);

    expect(screen.getByRole('button', { name: 'Toggle src' })).toBeCollapsed();

    await user.press(screen.getByRole('button', { name: 'Toggle src' }));

    expect(screen.getByRole('button', { name: 'Toggle src' })).toBeExpanded();
  });

  it('throws when rendered outside TreeItem', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(render(<TreeItemTrigger aria-label="Toggle" />)).rejects.toThrow(
      'TreeItemTrigger must be used within <TreeItem>',
    );
  });
});

describe('TreeItemRenameInput', () => {
  /** A row being renamed, its draft held by the consumer. */
  function Renaming(props: { onCommit: () => void; onCancel?: () => void; onBlur?: () => void }) {
    const [draft, setDraft] = useState('Layer 1');
    return (
      <TreeItem editing leaf>
        <TreeItemIndent depth={0} />
        <TreeItemLabel>
          <TreeItemRenameInput
            aria-label="Name"
            value={draft}
            onChangeText={setDraft}
            onCancel={() => undefined}
            {...props}
          />
        </TreeItemLabel>
        <Text>{draft}</Text>
      </TreeItem>
    );
  }

  it('commits once on the return key, which leaves the field', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn();
    await render(<Renaming onCommit={onCommit} />);

    await user.type(screen.getByLabelText('Name'), ' copy', { submitEditing: true });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Layer 1 copy')).toBeOnTheScreen();
  });

  it('commits when the field is left, and runs the caller onBlur too', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn();
    const onBlur = jest.fn();
    await render(<Renaming onCommit={onCommit} onBlur={onBlur} />);

    await user.type(screen.getByLabelText('Name'), 'x');

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('commits nothing while the field is still being typed in', async () => {
    const user = userEvent.setup();
    const onCommit = jest.fn();
    await render(<Renaming onCommit={onCommit} />);

    await user.type(screen.getByLabelText('Name'), 'x', { skipBlur: true });

    expect(onCommit).not.toHaveBeenCalled();
  });
});
