import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { Item } from '@/registry/bases/base-ui/ui/item';
import { isImeComposing } from '@/registry/bases/base-ui/lib/ime';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TreeItemContextValue {
  expanded: boolean;
}

const TreeItemContext = React.createContext<TreeItemContextValue | null>(null);

function useTreeItem(): TreeItemContextValue {
  const context = React.useContext(TreeItemContext);
  if (!context) throw new Error('TreeItemIndent must be used within <TreeItem>');
  return context;
}

interface TreeItemProps extends React.ComponentProps<typeof Item> {
  /** Whether the node's children are shown; sets `data-expanded` and names the disclosure. */
  expanded?: boolean;
  /** Whether the row is being renamed; sets `data-editing`. */
  editing?: boolean;
}

/**
 * One row of a hierarchy tree (a layer tree, a scene outliner, a file tree),
 * over upstream's `Item` at `size="xs"`. The row owns the shared rhythm and the
 * `group/tree-item` its parts style off; the consumer composes the rest: a
 * `TreeItemIndent`, a `TreeItemLabel` holding `ItemMedia` and `ItemTitle` (or a
 * `TreeItemRenameInput` while renaming), and `ItemActions` for trailing actions.
 * Selection and hover colour, row height and drag handlers go on the row itself.
 * A context menu wraps the row as `ContextMenuTrigger render={<TreeItem />}`.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView`, and a
 * wrapping Base UI `render` trigger composes its ref through it.
 */
function TreeItem({
  expanded = false,
  editing = false,
  size = 'xs',
  className,
  ...props
}: TreeItemProps): React.ReactNode {
  const context = React.useMemo(() => ({ expanded }), [expanded]);
  return (
    <TreeItemContext.Provider value={context}>
      <Item
        data-slot="tree-item"
        data-expanded={expanded || undefined}
        data-editing={editing || undefined}
        size={size}
        className={cn('group/tree-item flex-nowrap gap-1 py-0 pr-1 pl-0 text-xs', className)}
        {...props}
      />
    </TreeItemContext.Provider>
  );
}

interface TreeItemIndentProps extends React.ComponentProps<'span'> {
  /** Nesting depth; 0 for roots. Drives the left indent. */
  depth: number;
  /** Pixels of indent added per depth level. Default 12. */
  indentStep?: number;
  /** Pixels of indent at depth 0. Default 0. */
  baseIndent?: number;
  /** Whether the node has children - shows the chevron vs. a same-width spacer. */
  hasChildren: boolean;
  /** Toggle expand/collapse. The chevron stops propagation so it never selects the row. */
  onToggleExpand: () => void;
  /** a11y label for the disclosure control when collapsed. */
  expandLabel?: string;
  /** a11y label for the disclosure control when expanded. */
  collapseLabel?: string;
}

/**
 * The row's depth indent (`baseIndent + depth * indentStep` px) and disclosure
 * control: a chevron that turns while the row is `expanded`, or a spacer for a
 * leaf so names stay aligned. Place it first in a `TreeItem`.
 */
function TreeItemIndent({
  depth,
  indentStep = 12,
  baseIndent = 0,
  hasChildren,
  onToggleExpand,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  className,
  style,
  ...props
}: TreeItemIndentProps): React.ReactNode {
  const { expanded } = useTreeItem();
  return (
    <span
      data-slot="tree-item-indent"
      className={cn('flex shrink-0 items-center', className)}
      style={{ paddingLeft: baseIndent + depth * indentStep, ...style }}
      {...props}
    >
      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={expanded ? collapseLabel : expandLabel}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronRight className="transition-transform group-data-expanded/tree-item:rotate-90" />
        </Button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
    </span>
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
      className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-1', className)}
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
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') onCancel();
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

export { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemRenameInput };
export type { TreeItemProps, TreeItemIndentProps, TreeItemRenameInputProps };
