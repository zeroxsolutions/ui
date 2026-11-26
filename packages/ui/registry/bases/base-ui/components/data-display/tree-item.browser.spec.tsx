import { createRef, type KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion, settled } from '../../../../../test/motion';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/registry/bases/base-ui/ui/context-menu';
import { ItemActions, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput, TreeItemTrigger } from './tree-item';

const row = () => page.getByTestId('tree-item');

describe('TreeItem', () => {
  it('renders the parts the consumer composes and hands the label click its raw event', async () => {
    const onActivate = vi.fn();
    await render(
      <TreeItem>
        <TreeItemIndent depth={0} />
        <TreeItemLabel onClick={onActivate}>
          <ItemTitle>Layer 1</ItemTitle>
        </TreeItemLabel>
        <ItemActions>
          <button type="button">Hide</button>
        </ItemActions>
      </TreeItem>,
    );

    await userEvent.click(page.getByText('Layer 1'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0]).toHaveProperty('type', 'click');
    expect(
      row()
        .element()
        .contains(page.getByRole('button', { name: 'Hide' }).element()),
    ).toBe(true);
  });

  it('hands a caller ref the row', async () => {
    const ref = createRef<HTMLDivElement>();
    await render(
      <TreeItem ref={ref}>
        <TreeItemLabel>Layer 1</TreeItemLabel>
      </TreeItem>,
    );
    expect(ref.current).toBe(row().element());
  });

  it('opens a context menu the consumer wraps around the row', async () => {
    await render(
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

    await userEvent.click(page.getByText('Layer 1'), { button: 'right' });
    await expect.element(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  });
});

describe('TreeItemTrigger', () => {
  it('runs the caller onClick without the click reaching the row, so the row is not selected', async () => {
    const onToggle = vi.fn();
    const onRowClick = vi.fn();
    await render(
      <TreeItem onClick={onRowClick}>
        <TreeItemIndent depth={0}>
          <TreeItemTrigger aria-label="Toggle node" onClick={onToggle} />
        </TreeItemIndent>
      </TreeItem>,
    );

    await userEvent.click(page.getByRole('button', { name: 'Toggle node' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("reports the row's expanded state as aria-expanded", async () => {
    const { rerender } = await render(
      <TreeItem>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    await expect.element(page.getByRole('button', { name: 'Toggle node' })).toHaveAttribute('aria-expanded', 'false');

    await rerender(
      <TreeItem expanded>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    await expect.element(page.getByRole('button', { name: 'Toggle node' })).toHaveAttribute('aria-expanded', 'true');
  });

  // The browser project runs as a reader who asked for reduced motion.
  it('keeps the chevron still on hover and focus when the reader prefers reduced motion', async () => {
    await userEvent.unhover(document.body);
    await render(
      <TreeItem>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    const trigger = page.getByRole('button', { name: 'Toggle node' });

    await userEvent.hover(trigger);
    await expectStill(trigger.element());
    await userEvent.unhover(trigger);
    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    await expectStill(trigger.element());
  });

  describe('with motion allowed', () => {
    playMotion();

    it('plays the chevron while the pointer or the focus is on the trigger', async () => {
      // The pointer rests where the case before left it, which a trigger drawn under it would take as an enter.
      await userEvent.unhover(document.body);
      await render(
        <TreeItem>
          <TreeItemTrigger aria-label="Toggle node" />
        </TreeItem>,
      );
      const trigger = page.getByRole('button', { name: 'Toggle node' });

      await userEvent.hover(trigger);
      await expectPlaying(trigger.element(), drawingIn(trigger.element()));
      await userEvent.unhover(trigger);
      const rest = await settled(trigger.element());

      await userEvent.tab();
      await expect.element(trigger).toHaveFocus();
      await expectPlaying(trigger.element(), rest);
    });
  });
});

describe('TreeItemIndent', () => {
  it('offers no control on a leaf row', async () => {
    await render(
      <TreeItem leaf>
        <TreeItemIndent depth={1} />
        <TreeItemLabel>index.ts</TreeItemLabel>
      </TreeItem>,
    );
    await expect.element(page.getByText('index.ts')).toBeVisible();
    await expect.element(page.getByRole('button')).not.toBeInTheDocument();
  });
});

describe('TreeItemRenameInput', () => {
  async function renderRename(handlers: {
    onCommit?: () => void;
    onCancel?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  }) {
    const onRowKeyDown = vi.fn();
    const onRowClick = vi.fn();
    await render(
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
    const input = page.getByRole('textbox');
    await expect.element(input).toHaveFocus();
    return { input, onRowKeyDown, onRowClick };
  }

  it('cancels on Escape without the key reaching the row, and runs the consumer handler too', async () => {
    const onCancel = vi.fn();
    const onKeyDown = vi.fn();
    const { onRowKeyDown } = await renderRename({ onCancel, onKeyDown });

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onRowKeyDown).not.toHaveBeenCalled();
  });

  it('takes the focus as it mounts, and commits on Enter', async () => {
    const onCommit = vi.fn();
    await renderRename({ onCommit });

    await userEvent.keyboard('{Enter}');
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('keeps a click in the input from reaching the row', async () => {
    const { input, onRowClick } = await renderRename({});

    await userEvent.click(input);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("skips the commit when a caller's onKeyDown prevents the default on Enter, but still runs", async () => {
    const onCommit = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLInputElement>) => event.preventDefault());
    await renderRename({ onCommit, onKeyDown });

    await userEvent.keyboard('{Enter}');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("skips the cancel when a caller's onKeyDown prevents the default on Escape, but still runs", async () => {
    const onCancel = vi.fn();
    const onKeyDown = vi.fn((event: KeyboardEvent<HTMLInputElement>) => event.preventDefault());
    await renderRename({ onCancel, onKeyDown });

    await userEvent.keyboard('{Escape}');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
