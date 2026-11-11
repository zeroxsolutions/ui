import { render, screen, userEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { FileTree, FileTreeGroup, FileTreeItem, FileTreeLabel, type FileTreeProps } from './file-tree';

/** The web demo's bundle: a folder over two files, then a file at the top level. */
function Bundle(props: Omit<FileTreeProps, 'children'>) {
  return (
    <FileTree aria-label="Files" testID="tree" {...props}>
      <FileTreeItem value="src" testID="item-src">
        <FileTreeLabel>src</FileTreeLabel>
        <FileTreeGroup testID="group-src">
          <FileTreeItem value="src/index.ts" testID="item-src/index.ts">
            <FileTreeLabel>index.ts</FileTreeLabel>
          </FileTreeItem>
          <FileTreeItem value="src/util.ts" testID="item-src/util.ts">
            <FileTreeLabel>util.ts</FileTreeLabel>
          </FileTreeItem>
        </FileTreeGroup>
      </FileTreeItem>
      <FileTreeItem value="README.md" testID="item-README.md">
        <FileTreeLabel>README.md</FileTreeLabel>
      </FileTreeItem>
    </FileTree>
  );
}

describe('FileTree', () => {
  it('gives a screen reader the tree and each row as a tree item, with its name and a folder its expanded state', async () => {
    await render(<Bundle defaultExpanded={['src']} />);

    expect(screen.getByTestId('tree')).toHaveProp('role', 'tree');
    expect(screen.getByTestId('tree')).toHaveProp('aria-label', 'Files');
    expect(screen.getByTestId('group-src')).toHaveProp('role', 'group');
    expect(screen.getByRole('treeitem', { name: 'src', expanded: true })).toBeOnTheScreen();
    expect(screen.getAllByRole('treeitem')).toHaveLength(4);
    expect(screen.queryByRole('treeitem', { name: 'README.md', expanded: false })).toBeNull();
    expect(screen.queryByRole('treeitem', { name: 'README.md', expanded: true })).toBeNull();
  });

  it('renders no child of a collapsed folder, and announces it collapsed', async () => {
    await render(<Bundle />);

    expect(screen.getByRole('treeitem', { name: 'src', expanded: false })).toBeOnTheScreen();
    expect(screen.queryByText('index.ts')).toBeNull();
    expect(screen.queryByTestId('group-src')).toBeNull();
  });

  it('selects a row on a press and reports its value, uncontrolled', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Bundle defaultExpanded={['src']} defaultValue="src/index.ts" onValueChange={onValueChange} />);

    expect(screen.getByRole('treeitem', { name: 'index.ts', selected: true })).toBeOnTheScreen();

    await user.press(screen.getByText('README.md'));

    expect(onValueChange).toHaveBeenCalledWith('README.md');
    expect(screen.getByRole('treeitem', { name: 'README.md', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('treeitem', { name: 'index.ts', selected: false })).toBeOnTheScreen();
  });

  it('reports a press but keeps a controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    await render(<Bundle defaultExpanded={['src']} value="README.md" onValueChange={onValueChange} />);

    await user.press(screen.getByText('util.ts'));

    expect(onValueChange).toHaveBeenCalledWith('src/util.ts');
    expect(screen.getByRole('treeitem', { name: 'README.md', selected: true })).toBeOnTheScreen();
    expect(screen.getByRole('treeitem', { name: 'util.ts', selected: false })).toBeOnTheScreen();
  });

  it('opens and closes a folder on a press, selects it, and reports the expanded set, uncontrolled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = jest.fn();
    const onValueChange = jest.fn();
    await render(<Bundle onExpandedChange={onExpandedChange} onValueChange={onValueChange} />);

    await user.press(screen.getByText('src'));

    expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
    expect(onValueChange).toHaveBeenLastCalledWith('src');
    expect(screen.getByRole('treeitem', { name: 'src', expanded: true, selected: true })).toBeOnTheScreen();
    expect(screen.getByText('index.ts')).toBeOnTheScreen();

    await user.press(screen.getByText('src'));

    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('treeitem', { name: 'src', expanded: false })).toBeOnTheScreen();
    expect(screen.queryByText('index.ts')).toBeNull();
  });

  it('reports a press on a folder but keeps a controlled expanded set', async () => {
    const user = userEvent.setup();
    const onExpandedChange = jest.fn();
    await render(<Bundle expanded={[]} onExpandedChange={onExpandedChange} />);

    await user.press(screen.getByText('src'));

    expect(onExpandedChange).toHaveBeenCalledWith(['src']);
    expect(screen.getByRole('treeitem', { name: 'src', expanded: false })).toBeOnTheScreen();
    expect(screen.queryByText('index.ts')).toBeNull();
  });

  it('runs a caller onPress on the row before selecting it', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const onValueChange = jest.fn();
    await render(
      <FileTree aria-label="Files" onValueChange={onValueChange}>
        <FileTreeItem value="a.ts">
          <FileTreeLabel onPress={onPress}>a.ts</FileTreeLabel>
        </FileTreeItem>
      </FileTree>,
    );

    await user.press(screen.getByText('a.ts'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('a.ts');
  });

  it('throws when a label is rendered outside an item', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(
      render(
        <FileTree aria-label="Files">
          <FileTreeLabel>loose</FileTreeLabel>
        </FileTree>,
      ),
    ).rejects.toThrow('FileTreeLabel / FileTreeGroup must be used within <FileTreeItem>');

    jest.restoreAllMocks();
  });

  describe('on the web', () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'web');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("puts the tree item's role, level and states on the item that holds its group, named by its row", async () => {
      await render(<Bundle defaultExpanded={['src']} defaultValue="src/util.ts" />);

      const folder = screen.getByTestId('item-src');
      expect(folder).toHaveProp('role', 'treeitem');
      expect(folder).toHaveAccessibleName('src');
      expect(folder).toHaveProp('aria-level', 1);
      expect(folder).toHaveProp('aria-expanded', true);
      expect(folder).toHaveProp('aria-selected', false);
      const file = screen.getByTestId('item-src/util.ts');
      expect(file).toHaveProp('aria-level', 2);
      expect(file).toHaveProp('aria-selected', true);
      expect(file).not.toHaveProp('aria-expanded');
      expect(screen.getByTestId('group-src')).toHaveProp('role', 'group');
    });

    it('lets one item at a time take focus from Tab: the selected one while it shows, else the first', async () => {
      const focusable = () =>
        ['item-src', 'item-src/index.ts', 'item-src/util.ts', 'item-README.md'].filter(
          (id) => screen.queryByTestId(id)?.props.focusable === true,
        );

      const shown = await render(<Bundle defaultExpanded={['src']} defaultValue="src/util.ts" />);
      expect(focusable()).toEqual(['item-src/util.ts']);
      await shown.unmount();

      await render(<Bundle defaultValue="src/util.ts" />);
      expect(focusable()).toEqual(['item-src']);
    });
  });
});
