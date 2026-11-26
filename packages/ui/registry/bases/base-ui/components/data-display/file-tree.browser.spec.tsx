import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';

import { drawingIn, expectPlaying, expectStill, playMotion, settled } from '../../../../../test/motion';
import { FileTree, FileTreeGroup, FileTreeItem, FileTreeLabel, type FileTreeProps } from './file-tree';

/**
 * SKILL.md
 * src/            (folder)
 *   index.ts
 *   util.ts
 * README.md
 */
function renderTree(props?: FileTreeProps) {
  return render(
    <FileTree aria-label="Files" {...props}>
      <FileTreeItem value="SKILL.md">
        <FileTreeLabel>SKILL.md</FileTreeLabel>
      </FileTreeItem>
      <FileTreeItem value="src">
        <FileTreeLabel>src</FileTreeLabel>
        <FileTreeGroup>
          <FileTreeItem value="src/index.ts">
            <FileTreeLabel>index.ts</FileTreeLabel>
          </FileTreeItem>
          <FileTreeItem value="src/util.ts">
            <FileTreeLabel>util.ts</FileTreeLabel>
          </FileTreeItem>
        </FileTreeGroup>
      </FileTreeItem>
      <FileTreeItem value="README.md">
        <FileTreeLabel>README.md</FileTreeLabel>
      </FileTreeItem>
    </FileTree>,
  );
}

const item = (name: string) => page.getByRole('treeitem', { name, exact: true });

describe('FileTree - structure & ARIA', () => {
  it('exposes the tree/treeitem/group roles with correct levels and folder state', async () => {
    await renderTree({ defaultExpanded: ['src'] });

    await expect.element(page.getByRole('tree', { name: 'Files' })).toBeVisible();
    await expect.element(item('SKILL.md')).toHaveAttribute('aria-level', '1');
    await expect.element(item('index.ts')).toHaveAttribute('aria-level', '2');
    await expect.element(item('src')).toHaveAttribute('aria-expanded', 'true');
    await expect.element(item('SKILL.md')).not.toHaveAttribute('aria-expanded');
    await expect.element(page.getByRole('group')).toBeVisible();
  });

  it('collapsed folders do not render their children', async () => {
    await renderTree();
    await expect.element(item('src')).toHaveAttribute('aria-expanded', 'false');
    await expect.element(item('index.ts')).not.toBeInTheDocument();
  });

  it('keeps exactly one item in the tab order', async () => {
    await renderTree();

    await userEvent.tab();
    await expect.element(item('SKILL.md')).toHaveFocus();
    await userEvent.tab();
    await expect.element(item('src')).not.toHaveFocus();
    await expect.element(item('README.md')).not.toHaveFocus();
  });
});

describe('FileTree - selection', () => {
  it('selects a leaf on click and reports it (uncontrolled)', async () => {
    const onValueChange = vi.fn();
    await renderTree({ onValueChange });

    await userEvent.click(page.getByText('README.md'));
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    await expect.element(page.getByRole('treeitem', { name: 'README.md', selected: true })).toBeVisible();
  });

  it('reflects a controlled value without owning it', async () => {
    const onValueChange = vi.fn();
    await renderTree({ value: 'SKILL.md', onValueChange });

    await expect.element(page.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeVisible();
    await userEvent.click(page.getByText('README.md'));
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    await expect.element(page.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeVisible();
  });
});

describe('FileTree - folder expansion', () => {
  it('toggles a folder on click and reports the expanded set', async () => {
    const onExpandedChange = vi.fn();
    await renderTree({ onExpandedChange });

    await userEvent.click(page.getByText('src', { exact: true }));
    expect(onExpandedChange).toHaveBeenCalledWith(['src']);
    await expect.element(item('src')).toHaveAttribute('aria-expanded', 'true');
    await expect.element(item('index.ts')).toBeVisible();
  });
});

describe('FileTree - keyboard (WAI-ARIA APG)', () => {
  it('moves focus with ArrowDown / ArrowUp / Home / End', async () => {
    await renderTree({ defaultExpanded: ['src'] });
    await userEvent.tab();
    await expect.element(item('SKILL.md')).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect.element(item('src')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(item('SKILL.md')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(item('README.md')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(item('SKILL.md')).toHaveFocus();
  });

  it('ArrowRight expands a collapsed folder, then moves into the first child', async () => {
    await renderTree();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(item('src')).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect.element(item('src')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(item('index.ts')).toHaveFocus();
  });

  it('ArrowLeft from a child focuses the parent, then collapses it', async () => {
    await renderTree({ defaultExpanded: ['src'] });
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect.element(item('index.ts')).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(item('src')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(item('src')).toHaveAttribute('aria-expanded', 'false');
  });

  it('Enter and Space select the focused item', async () => {
    const onValueChange = vi.fn();
    await renderTree({ onValueChange });
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    await expect.element(item('README.md')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('README.md');

    await userEvent.keyboard('{Home}');
    await userEvent.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith('SKILL.md');
  });
});

describe('FileTree - composition', () => {
  it('hands a caller ref the tree element and keeps its own keyboard handling', async () => {
    const ref = React.createRef<HTMLUListElement>();
    await render(
      <FileTree aria-label="Files" ref={ref}>
        <FileTreeItem value="SKILL.md">
          <FileTreeLabel>SKILL.md</FileTreeLabel>
        </FileTreeItem>
        <FileTreeItem value="README.md">
          <FileTreeLabel>README.md</FileTreeLabel>
        </FileTreeItem>
      </FileTree>,
    );

    expect(ref.current).toBe(page.getByRole('tree', { name: 'Files' }).element());
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(item('README.md')).toHaveFocus();
  });

  it('keeps the depth indent under a caller style', async () => {
    await render(
      <FileTree aria-label="Files" defaultExpanded={['src']}>
        <FileTreeItem value="src">
          <FileTreeLabel>src</FileTreeLabel>
          <FileTreeGroup>
            <FileTreeItem value="src/index.ts">
              <FileTreeLabel style={{ opacity: 0.5 }}>index.ts</FileTreeLabel>
            </FileTreeItem>
            <FileTreeItem value="src/util.ts">
              <FileTreeLabel>util.ts</FileTreeLabel>
            </FileTreeItem>
          </FileTreeGroup>
        </FileTreeItem>
      </FileTree>,
    );

    const styled = page.getByText('index.ts').element() as HTMLElement;
    const plain = page.getByText('util.ts').element() as HTMLElement;
    expect(styled.style.opacity).toBe('0.5');
    expect(styled.style.paddingInlineStart).not.toBe('');
    expect(styled.style.paddingInlineStart).toBe(plain.style.paddingInlineStart);
  });
});

describe('FileTree - the folder chevron', () => {
  // The browser project runs as a reader who asked for reduced motion.
  it('keeps the chevron still on hover when the reader prefers reduced motion', async () => {
    await userEvent.unhover(document.body);
    await renderTree();
    const folder = page.getByText('src', { exact: true });

    await userEvent.hover(folder);
    await expectStill(folder.element());
  });

  describe('with motion allowed', () => {
    playMotion();

    it("plays a folder row's chevron while the pointer or the focus is on it", async () => {
      // The pointer rests where the case before left it, which a row drawn under it would take as an enter.
      await userEvent.unhover(document.body);
      await renderTree();
      const folder = page.getByText('src', { exact: true });

      await userEvent.hover(folder);
      await expectPlaying(folder.element(), drawingIn(folder.element()));
      await userEvent.unhover(folder);
      const rest = await settled(folder.element());

      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}');
      await expect.element(item('src')).toHaveFocus();
      await expectPlaying(folder.element(), rest);
    });
  });
});
