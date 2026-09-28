import type { ComponentProps, MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react';
import { ContextMenu, ContextMenuTrigger } from '@/registry/bases/base-ui/ui/context-menu';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { isImeComposing } from '@/registry/bases/base-ui/lib/ime';
import { cn } from '@/registry/bases/base-ui/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/registry/bases/base-ui/ui/button';

/** Inline-rename wiring for a {@link TreeItem}. Omit the whole object when the
 *  row isn't renamable. */
export interface TreeItemRename {
  editing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  inputClassName?: string;
}

/**
 * One row of a hierarchy tree, the layer above {@link TreeItemIndent}. TreeItemIndent
 * owns the indent + disclosure chevron; TreeItem owns the next shared layer:
 *
 * - a clickable name region (a plain `div`, not a `<button>` — see the W3C tree
 *   view pattern): `icon` + the name (or, while `rename.editing`, an
 *   inline `Input` with Enter-commit / Escape-cancel / stop-propagation, guarded
 *   against IME composition) + an `inlineEnd` slot for badges after the name,
 * - a `trailing` slot for hover actions (visibility / lock toggles), and
 * - optional `contextMenuContent`: when present the row is wrapped in a
 *   `ContextMenu` so a right-click opens it.
 *
 * Everything that legitimately differs stays caller-owned: selection/hover COLOUR
 * + row height via `className`, the icon + badges + actions via slots, drag/drop
 * spread straight onto the row (TreeItem extends the div props through TreeItemIndent).
 * `onActivate` gets the raw event so a caller can read shift/meta.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView` and so a
 * wrapping Base UI `render` context-menu trigger composes its ref.
 */
export interface TreeItemProps extends Omit<TreeItemIndentProps, 'children'> {
  /** Leading icon (node/kind icon). */
  icon?: ReactNode;
  /** Display name; shown unless `rename.editing`. */
  name: string;
  /** Extra classes on the name text span (strikethrough/italic/colour). The
   *  row's selection/hover background and any row-wide dimming live on
   *  `className` (TreeItemIndent) - the name isn't styled as a separate node. */
  nameClassName?: string;
  /** Click on the name region. Raw event so callers can read shift/meta keys. */
  onActivate?: (event: ReactMouseEvent) => void;
  /** Double-click on the name region (e.g. start rename). */
  onActivateDoubleClick?: () => void;
  /** Inline rename; omit when the row isn't renamable. */
  rename?: TreeItemRename;
  /** Badges shown after the name, inside the clickable area. */
  inlineEnd?: ReactNode;
  /** Trailing actions (visibility / lock). The caller owns hover/opacity classes. */
  trailing?: ReactNode;
  /** `<ContextMenuContent>…`. When set, the row is wrapped in a `ContextMenu`. */
  contextMenuContent?: ReactNode;
}

function TreeItem({
  icon,
  name,
  nameClassName,
  onActivate,
  onActivateDoubleClick,
  rename,
  inlineEnd,
  trailing,
  contextMenuContent,
  ref,
  ...rowProps
}: TreeItemProps) {
  const row = (
    <TreeItemIndent ref={ref} {...rowProps}>
      {/* The name is a plain clickable region, NOT a <button>: per the W3C tree
          view pattern a treeitem's activation is owned by the tree (roving
          tabindex + Enter), so this skeleton leaves role/keyboard to the
          consumer (the TreeItemIndent owns hover/selection). A <div> also holds the
          rename <input> as a valid child - a <button> may not nest one. The
          `data-slot="tree-item"` rides this content region (not the TreeItemIndent
          root) so TreeItemIndent keeps its own `tree-item-indent` slot and neither
          overrides the other. */}
      <div
        data-slot="tree-item"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-1 text-xs"
        onClick={onActivate}
        onDoubleClick={onActivateDoubleClick}
      >
        {icon}
        {rename?.editing ? (
          <Input
            ref={rename.inputRef}
            value={rename.draft}
            onChange={(e) => rename.onDraftChange(e.target.value)}
            onBlur={rename.onCommit}
            onKeyDown={(e) => {
              if (isImeComposing(e.nativeEvent)) return;
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') rename.onCancel();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            autoFocus
            className={cn('min-w-0 flex-1', rename.inputClassName)}
          />
        ) : (
          <span className={cn('flex-1 truncate', nameClassName)}>{name}</span>
        )}
        {inlineEnd}
      </div>
      {trailing}
    </TreeItemIndent>
  );

  if (!contextMenuContent) return row;
  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      {contextMenuContent}
    </ContextMenu>
  );
}

/**
 * The shared skeleton of one row in a hierarchy tree (a layer tree, a scene
 * outliner, a file tree). It owns only what such trees share:
 *
 * - the row container as a flex `group` (so trailing actions reveal on
 *   `group-hover:`),
 * - depth indent (`baseIndent + depth * indentStep` px of left padding),
 * - the disclosure control: a chevron that rotates 90deg when `expanded`, or a
 *   same-width spacer for leaves so names stay aligned.
 *
 * Everything that legitimately differs is caller-owned and passes through, so no
 * consumer's look is forced onto another:
 *
 * - selection/hover COLOUR and row height -> `className` (one tree may want a
 *   fixed height for virtualization, another auto height),
 * - the icon, the name (or an inline-rename input), trailing actions -> `children`,
 * - drag/drop handlers, `draggable`, `onContextMenu`, etc. -> spread onto the row.
 *
 * `ref` reaches the row div - a consumer needs it for `scrollIntoView` and so a
 * wrapping Base UI `render` trigger (e.g. a context menu) can compose its ref.
 */
export interface TreeItemIndentProps extends ComponentProps<'div'> {
  /** Nesting depth; 0 for roots. Drives the left indent. */
  depth: number;
  /** Pixels of indent added per depth level. Default 12. */
  indentStep?: number;
  /** Pixels of indent at depth 0. Default 0. */
  baseIndent?: number;
  /** Whether the node has children - shows the chevron vs. a spacer. */
  hasChildren: boolean;
  /** Whether the node is expanded - rotates the chevron and sets the a11y label. */
  expanded: boolean;
  /** Toggle expand/collapse. The chevron stops propagation so it never selects. */
  onToggleExpand: () => void;
  /** a11y label for the disclosure control when collapsed. */
  expandLabel?: string;
  /** a11y label for the disclosure control when expanded. */
  collapseLabel?: string;
  children: ReactNode;
}

function TreeItemIndent({
  depth,
  indentStep = 12,
  baseIndent = 0,
  hasChildren,
  expanded,
  onToggleExpand,
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  className,
  style,
  children,
  ...rest
}: TreeItemIndentProps) {
  return (
    <div
      data-slot="tree-item-indent"
      // The shared row rhythm: rounded-md, a gap before trailing actions, and a
      // hair of right padding. Callers override any of these via `className`
      // (cn = tailwind-merge) and own selection/hover COLOUR + row height.
      className={cn('group flex items-center gap-1 rounded-md pr-1', className)}
      style={{ paddingLeft: baseIndent + depth * indentStep, ...style }}
      {...rest}
    >
      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={expanded ? collapseLabel : expandLabel}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <ChevronRight className={cn('transition-transform', expanded && 'rotate-90')} />
        </Button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
      {children}
    </div>
  );
}

export { TreeItem, TreeItemIndent };
