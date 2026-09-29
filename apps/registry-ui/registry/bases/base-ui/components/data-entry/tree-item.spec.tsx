import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/registry/bases/base-ui/ui/context-menu';
import { ItemActions, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput } from './tree-item';

afterEach(cleanup);

function row(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="tree-item"]')!;
}

describe('TreeItem', () => {
  it('renders the parts the consumer composes and hands the label click its raw event', () => {
    const onActivate = vi.fn();
    render(
      <TreeItem>
        <TreeItemIndent depth={0} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel onClick={onActivate}>
          <ItemTitle>Layer 1</ItemTitle>
        </TreeItemLabel>
        <ItemActions>
          <button type="button">Hide</button>
        </ItemActions>
      </TreeItem>,
    );

    fireEvent.click(screen.getByText('Layer 1'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0]).toHaveProperty('type', 'click');
    expect(row().contains(screen.getByRole('button', { name: 'Hide' }))).toBe(true);
  });

  it('carries data-expanded and data-editing from its props', () => {
    const { rerender } = render(
      <TreeItem>
        <TreeItemLabel>node</TreeItemLabel>
      </TreeItem>,
    );
    expect(row().hasAttribute('data-expanded')).toBe(false);
    expect(row().hasAttribute('data-editing')).toBe(false);

    rerender(
      <TreeItem expanded editing>
        <TreeItemLabel>node</TreeItemLabel>
      </TreeItem>,
    );
    expect(row().hasAttribute('data-expanded')).toBe(true);
    expect(row().hasAttribute('data-editing')).toBe(true);
  });

  it('forwards ref to the row div (React 19 ref-as-prop, no forwardRef)', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TreeItem ref={ref}>
        <TreeItemLabel>Layer 1</TreeItemLabel>
      </TreeItem>,
    );
    expect(ref.current).toBe(row());
  });

  it('opens a context menu the consumer wraps around the row', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <TreeItem>
              <TreeItemLabel>Layer 1</TreeItemLabel>
            </TreeItem>
          }
        />
        <ContextMenuContent>
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    fireEvent.contextMenu(screen.getByText('Layer 1'));
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeTruthy();
  });
});

describe('TreeItemIndent', () => {
  it('indents by baseIndent + depth * indentStep', () => {
    render(
      <TreeItem>
        <TreeItemIndent depth={2} indentStep={12} baseIndent={4} hasChildren={false} onToggleExpand={() => {}} />
      </TreeItem>,
    );
    const indent = document.querySelector<HTMLElement>('[data-slot="tree-item-indent"]');
    expect(indent?.style.paddingLeft).toBe('28px');
  });

  it('toggles via the chevron and stops propagation so the row is not selected', () => {
    const onToggleExpand = vi.fn();
    const onRowClick = vi.fn();
    render(
      <TreeItem onClick={onRowClick}>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={onToggleExpand} expandLabel="Expand node" />
      </TreeItem>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("names the disclosure from the row's expanded state", () => {
    render(
      <TreeItem expanded>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={() => {}} />
      </TreeItem>,
    );
    expect(screen.getByRole('button', { name: 'Collapse' })).toBeTruthy();
  });

  it('renders an aligned spacer (no disclosure button) for a leaf', () => {
    render(
      <TreeItem>
        <TreeItemIndent depth={0} hasChildren={false} onToggleExpand={() => {}} />
      </TreeItem>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TreeItemRenameInput', () => {
  function renderRename(handlers: { onCommit?: () => void; onCancel?: () => void; onKeyDown?: () => void }) {
    const onRowKeyDown = vi.fn();
    const onRowClick = vi.fn();
    render(
      <TreeItem editing onKeyDown={onRowKeyDown} onClick={onRowClick}>
        <TreeItemLabel>
          <TreeItemRenameInput
            defaultValue="Layer 1"
            onCommit={handlers.onCommit ?? (() => {})}
            onCancel={handlers.onCancel ?? (() => {})}
            onKeyDown={handlers.onKeyDown}
          />
        </TreeItemLabel>
      </TreeItem>,
    );
    return { input: screen.getByRole('textbox') as HTMLInputElement, onRowKeyDown, onRowClick };
  }

  it('cancels on Escape without the key reaching the row, and runs the consumer handler too', () => {
    const onCancel = vi.fn();
    const onKeyDown = vi.fn();
    const { input, onRowKeyDown } = renderRename({ onCancel, onKeyDown });

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onRowKeyDown).not.toHaveBeenCalled();
  });

  it('commits on blur, which Enter triggers', () => {
    const onCommit = vi.fn();
    const { input } = renderRename({ onCommit });

    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('keeps a click in the input from reaching the row', () => {
    const { input, onRowClick } = renderRename({});

    fireEvent.click(input);
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
