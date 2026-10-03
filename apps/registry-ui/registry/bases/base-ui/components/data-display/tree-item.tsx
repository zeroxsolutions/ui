'use client';

import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { ChevronRightIcon, type ChevronRightIconHandle } from '@/registry/bases/base-ui/ui/chevron-right';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { isImeComposing } from '@/registry/bases/base-ui/lib/ime';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TreeItemContextValue {
  expanded: boolean;
}

const TreeItemContext = React.createContext<TreeItemContextValue | null>(null);

function useTreeItem(): TreeItemContextValue {
  const context = React.useContext(TreeItemContext);
  if (!context) throw new Error('TreeItemTrigger must be used within <TreeItem>');
  return context;
}

interface TreeItemProps extends React.ComponentProps<'div'> {
  /** Whether the node's children are shown; sets `data-expanded` and the trigger's `aria-expanded`. */
  expanded?: boolean;
  /** Whether the node has no children; sets `data-leaf`, which keeps the name aligned with its siblings' names. */
  leaf?: boolean;
  /** Whether the row is being renamed; sets `data-editing`. */
  editing?: boolean;
}

/**
 * One row of a hierarchy tree (a layer tree, a scene outliner, a file tree),
 * drawn as `FileTree` draws its rows: 28px high, rounded, muted on hover, on one
 * line, so a long name truncates instead of dropping the actions onto a second
 * line. It grows to fit a `TreeItemRenameInput` while renaming. The row owns the
 * `group/tree-item` its parts style off. The consumer composes the rest:
 *
 *   <TreeItem expanded={open}>
 *     <TreeItemIndent depth={0}>
 *       <TreeItemTrigger aria-label="Toggle src" onClick={toggle} />
 *     </TreeItemIndent>
 *     <TreeItemLabel><ItemTitle>src</ItemTitle></TreeItemLabel>
 *   </TreeItem>
 *   <TreeItem leaf>
 *     <TreeItemIndent depth={1} />
 *     <TreeItemLabel><ItemTitle>index.ts</ItemTitle></TreeItemLabel>
 *   </TreeItem>
 *
 * A `TreeItemRenameInput` replaces the title while renaming, and `ItemActions`
 * holds trailing actions. Selection state and drag handlers go on the row
 * itself. A context menu wraps the row as `ContextMenuTrigger render={<TreeItem />}`.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView`, and a
 * wrapping Base UI `render` trigger composes its ref through it.
 */
function TreeItem({
  expanded = false,
  leaf = false,
  editing = false,
  className,
  ...props
}: TreeItemProps): React.ReactNode {
  const context = React.useMemo(() => ({ expanded }), [expanded]);
  return (
    <TreeItemContext.Provider value={context}>
      <div
        data-slot="tree-item"
        data-expanded={expanded || undefined}
        data-leaf={leaf || undefined}
        data-editing={editing || undefined}
        className={cn(
          'group/tree-item text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex min-h-7 w-full min-w-0 items-center gap-1.5 rounded-md ps-1.5 pe-2 text-sm transition-colors outline-none focus-visible:ring-3',
          className,
        )}
        {...props}
      />
    </TreeItemContext.Provider>
  );
}

interface TreeItemIndentProps extends React.ComponentProps<'span'> {
  /** Nesting depth; 0 for roots. Each level indents three spacing steps. */
  depth: number;
}

/**
 * The row's leading column, first in a `TreeItem`: a depth indent of three
 * spacing steps per level, then its `children` - a folder row's
 * `TreeItemTrigger`. On a `leaf` row it holds the room the trigger takes
 * instead - an invisible, inert button of the trigger's own size - so a leaf's
 * name lines up with its folder siblings' names.
 */
function TreeItemIndent({ depth, className, style, children, ...props }: TreeItemIndentProps): React.ReactNode {
  return (
    <span
      data-slot="tree-item-indent"
      className={cn('flex shrink-0 items-center ps-[calc(var(--tree-item-depth)*--spacing(3))]', className)}
      style={{ '--tree-item-depth': depth, ...style } as React.CSSProperties}
      {...props}
    >
      <span aria-hidden className="hidden group-data-leaf/tree-item:flex">
        <Button variant="ghost" size="icon-xs" tabIndex={-1} disabled className="invisible" />
      </span>
      {children}
    </span>
  );
}

/**
 * The disclosure control of a folder row: upstream's link `icon-xs` button, which has no expanded
 * fill, holding a chevron that turns while the row is `expanded`, with `aria-expanded` from the row.
 * The caller gives it its `aria-label` and its `onClick`; the click never reaches the row, so it
 * never selects it. It goes in the row's `TreeItemIndent`, and a leaf row leaves it out. The chevron
 * plays on the button's hover or focus.
 */
function TreeItemTrigger({
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>): React.ReactNode {
  const { expanded } = useTreeItem();
  const iconRef = React.useRef<ChevronRightIconHandle>(null);
  return (
    <Button
      data-slot="tree-item-trigger"
      type="button"
      variant="link"
      size="icon-xs"
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        iconRef.current?.startAnimation();
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event);
        iconRef.current?.stopAnimation();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        iconRef.current?.startAnimation();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        iconRef.current?.stopAnimation();
      }}
      {...props}
    >
      <ChevronRightIcon
        ref={iconRef}
        className="group-data-expanded/tree-item:rotate-90 motion-safe:transition-transform"
      />
    </Button>
  );
}

/**
 * The row's clickable name region, holding `ItemMedia`, `ItemTitle` or a
 * `TreeItemRenameInput`, and any badges after the name. A plain `div`, not a
 * `<button>`: per the W3C tree view pattern the tree owns activation (roving
 * tabindex + Enter), and a `div` may hold the rename input where a button may
 * not. `onClick` receives the raw event, so a caller can read shift/meta.
 */
function TreeItemLabel({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return (
    <div
      data-slot="tree-item-label"
      className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-1.5', className)}
      {...props}
    />
  );
}

interface TreeItemRenameInputProps extends React.ComponentProps<typeof Input> {
  /** Called when the input loses focus, which Enter triggers: apply the draft. */
  onCommit: () => void;
  /** Called on Escape: drop the draft. */
  onCancel: () => void;
}

/**
 * The inline rename input: focused on mount, Enter commits (by blurring),
 * Escape cancels, and keys typed during IME composition are left to the IME.
 * Every other key, and every click and double-click, stops here, so none of
 * them selects, activates or renames the row underneath. The consumer owns the
 * draft (`value` + `onChange`).
 */
function TreeItemRenameInput({
  onCommit,
  onCancel,
  onBlur,
  onKeyDown,
  onClick,
  onDoubleClick,
  className,
  ...props
}: TreeItemRenameInputProps): React.ReactNode {
  return (
    <Input
      data-slot="tree-item-rename-input"
      autoFocus
      className={cn('min-w-0 flex-1', className)}
      onBlur={(event) => {
        onBlur?.(event);
        onCommit();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (isImeComposing(event.nativeEvent)) return;
        if (!event.defaultPrevented) {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') onCancel();
        }
        event.stopPropagation();
      }}
      onClick={(event) => {
        onClick?.(event);
        event.stopPropagation();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        event.stopPropagation();
      }}
      {...props}
    />
  );
}

export { TreeItem, TreeItemIndent, TreeItemTrigger, TreeItemLabel, TreeItemRenameInput };
export type { TreeItemProps, TreeItemIndentProps, TreeItemRenameInputProps };
