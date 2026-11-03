import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps, type KeyboardEvent } from 'react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/registry/bases/base-ui/ui/context-menu';
import { ItemActions, ItemTitle } from '@/registry/bases/base-ui/ui/item';

import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput, TreeItemTrigger } from './tree-item';

const { startAnimation, stopAnimation } = vi.hoisted(() => ({
  startAnimation: vi.fn(),
  stopAnimation: vi.fn(),
}));

vi.mock('@/registry/bases/base-ui/icons/chevron-right-icon', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/registry/bases/base-ui/icons/chevron-right-icon')>();
  return {
    ...actual,
    ChevronRightIcon: React.forwardRef<unknown, ComponentProps<'div'>>((props, ref) => {
      React.useImperativeHandle(ref, () => ({ startAnimation, stopAnimation }));
      return <div aria-hidden={props['aria-hidden']} className={props.className} />;
    }),
  };
});

function stubPrefersReducedMotion(matches: boolean): void {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  } as MediaQueryList);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  startAnimation.mockClear();
  stopAnimation.mockClear();
});

function row(): HTMLElement {
  // Testing Library mounts each render in a div appended to the body; the component's root is its first child.
  return document.body.firstElementChild?.firstElementChild as HTMLElement;
}

describe('TreeItem', () => {
  it('renders the parts the consumer composes and hands the label click its raw event', () => {
    const onActivate = vi.fn();
    render(
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

describe('TreeItemTrigger', () => {
  it('runs the caller onClick without the click reaching the row, so the row is not selected', () => {
    const onToggle = vi.fn();
    const onRowClick = vi.fn();
    render(
      <TreeItem onClick={onRowClick}>
        <TreeItemIndent depth={0}>
          <TreeItemTrigger aria-label="Toggle node" onClick={onToggle} />
        </TreeItemIndent>
      </TreeItem>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle node' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("reports the row's expanded state as aria-expanded", () => {
    const { rerender } = render(
      <TreeItem>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    expect(screen.getByRole('button', { name: 'Toggle node' }).getAttribute('aria-expanded')).toBe('false');

    rerender(
      <TreeItem expanded>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    expect(screen.getByRole('button', { name: 'Toggle node' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('skips the chevron hover and focus animation when the user prefers reduced motion', () => {
    stubPrefersReducedMotion(true);
    render(
      <TreeItem>
        <TreeItemTrigger aria-label="Toggle node" />
      </TreeItem>,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle node' });

    fireEvent.mouseEnter(trigger);
    fireEvent.focus(trigger);
    expect(startAnimation).not.toHaveBeenCalled();

    fireEvent.mouseLeave(trigger);
    fireEvent.blur(trigger);
    expect(stopAnimation).not.toHaveBeenCalled();
  });
});

describe('TreeItemIndent', () => {
  it('offers no control on a leaf row', () => {
    render(
      <TreeItem leaf>
        <TreeItemIndent depth={1} />
        <TreeItemLabel>index.ts</TreeItemLabel>
      </TreeItem>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('TreeItemRenameInput', () => {
  function renderRename(handlers: {
    onCommit?: () => void;
    onCancel?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  }) {
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

  it("skips the commit when a caller's onKeyDown prevents the default on Enter, but still runs", () => {
    const onCommit = vi.fn();
    const onKeyDown = vi.fn((event) => event.preventDefault());
    const { input } = renderRename({ onCommit, onKeyDown });

    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("skips the cancel when a caller's onKeyDown prevents the default on Escape, but still runs", () => {
    const onCancel = vi.fn();
    const onKeyDown = vi.fn((event) => event.preventDefault());
    const { input } = renderRename({ onCancel, onKeyDown });

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
