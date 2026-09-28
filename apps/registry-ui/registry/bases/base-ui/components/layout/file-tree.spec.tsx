import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileTree, FileTreeGroup, FileTreeItem, FileTreeLabel, type FileTreeProps } from './file-tree';

afterEach(() => {
  cleanup();
});

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

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('FileTree — structure & ARIA', () => {
  it('exposes the tree/treeitem/group roles with correct levels and folder state', () => {
    renderTree({ defaultExpanded: ['src'] });

    expect(screen.getByRole('tree', { name: 'Files' })).toBeTruthy();
    expect(item('SKILL.md').getAttribute('aria-level')).toBe('1');
    expect(item('index.ts').getAttribute('aria-level')).toBe('2');

    // Only the folder is expandable.
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(item('SKILL.md').hasAttribute('aria-expanded')).toBe(false);
    expect(screen.getByRole('group')).toBeTruthy();
  });

  it('collapsed folders do not render their children', () => {
    renderTree();
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('treeitem', { name: 'index.ts' })).toBeNull();
  });

  it('keeps exactly one item tabbable (roving tabindex)', () => {
    renderTree();
    const items = screen.getAllByRole('treeitem');
    expect(items[0].tabIndex).toBe(0);
    expect(items.slice(1).every((el) => el.tabIndex === -1)).toBe(true);
  });
});

describe('FileTree — selection', () => {
  it('selects a leaf on click and reports it (uncontrolled)', () => {
    const onValueChange = vi.fn();
    renderTree({ onValueChange });

    fireEvent.click(screen.getByText('README.md'));
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    expect(screen.getByRole('treeitem', { name: 'README.md', selected: true })).toBeTruthy();
  });

  it('reflects a controlled value without owning it', () => {
    const onValueChange = vi.fn();
    renderTree({ value: 'SKILL.md', onValueChange });

    expect(screen.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeTruthy();
    fireEvent.click(screen.getByText('README.md'));
    // Controlled: parent decides; selection stays on SKILL.md until value changes.
    expect(onValueChange).toHaveBeenCalledWith('README.md');
    expect(screen.getByRole('treeitem', { name: 'SKILL.md', selected: true })).toBeTruthy();
  });
});

describe('FileTree — folder expansion', () => {
  it('toggles a folder on click and reports the expanded set', () => {
    const onExpandedChange = vi.fn();
    renderTree({ onExpandedChange });

    fireEvent.click(screen.getByText('src'));
    expect(onExpandedChange).toHaveBeenCalledWith(['src']);
    expect(item('src').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('treeitem', { name: 'index.ts' })).toBeTruthy();
  });
});

describe('FileTree — keyboard (WAI-ARIA APG)', () => {
  it('moves focus with ArrowDown / ArrowUp / Home / End', () => {
    renderTree({ defaultExpanded: ['src'] });
    const first = item('SKILL.md');
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(item('src'));

    fireEvent.keyDown(item('src'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(item('SKILL.md'));

    fireEvent.keyDown(item('SKILL.md'), { key: 'End' });
    expect(document.activeElement).toBe(item('README.md'));

    fireEvent.keyDown(item('README.md'), { key: 'Home' });
    expect(document.activeElement).toBe(item('SKILL.md'));
  });

  it('ArrowRight expands a collapsed folder, then moves into the first child', () => {
    renderTree();
    const src = item('src');
    src.focus();

    fireEvent.keyDown(src, { key: 'ArrowRight' });
    expect(item('src').getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(item('src'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(item('index.ts'));
  });

  it('ArrowLeft collapses an open folder, and from a child focuses the parent', () => {
    renderTree({ defaultExpanded: ['src'] });

    const child = item('index.ts');
    child.focus();
    fireEvent.keyDown(child, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(item('src'));

    fireEvent.keyDown(item('src'), { key: 'ArrowLeft' });
    expect(item('src').getAttribute('aria-expanded')).toBe('false');
  });

  it('Enter and Space select the focused item', () => {
    const onValueChange = vi.fn();
    renderTree({ onValueChange });

    const readme = item('README.md');
    readme.focus();
    fireEvent.keyDown(readme, { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith('README.md');

    const skill = item('SKILL.md');
    skill.focus();
    fireEvent.keyDown(skill, { key: ' ' });
    expect(onValueChange).toHaveBeenLastCalledWith('SKILL.md');
  });
});
