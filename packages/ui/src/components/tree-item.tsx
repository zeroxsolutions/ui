import type {
  MouseEvent as ReactMouseEvent,
  ReactNode,
  RefObject,
} from "react"

import { TreeRow, type TreeRowProps } from "@/components/tree-row"
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Input } from "@/components/ui/input"
import { isImeComposing } from "@/lib/ime"
import { cn } from "@/lib/utils"

/** Inline-rename wiring for a {@link TreeItem}. Omit the whole object when the
 *  row isn't renamable. */
export interface TreeItemRename {
  editing: boolean
  draft: string
  onDraftChange: (value: string) => void
  onCommit: () => void
  onCancel: () => void
  inputRef?: RefObject<HTMLInputElement | null>
  inputClassName?: string
}

/**
 * One row of a hierarchy tree, the layer above {@link TreeRow}. TreeRow owns the
 * indent + disclosure chevron; TreeItem owns the next shared layer:
 *
 * - a clickable name button: `icon` + the name (or, while `rename.editing`, an
 *   inline `Input` with Enter-commit / Escape-cancel / stop-propagation, guarded
 *   against IME composition) + an `inlineEnd` slot for badges after the name,
 * - a `trailing` slot for hover actions (visibility / lock toggles), and
 * - optional `contextMenuContent`: when present the row is wrapped in a
 *   `ContextMenu` so a right-click opens it.
 *
 * Everything that legitimately differs stays caller-owned: selection/hover COLOUR
 * + row height via `className`, the icon + badges + actions via slots, drag/drop
 * spread straight onto the row (TreeItem extends the div props through TreeRow).
 * `onActivate` gets the raw event so a caller can read shift/meta.
 *
 * `ref` reaches the row div — a consumer needs it for `scrollIntoView` and so a
 * wrapping Base UI `render` context-menu trigger composes its ref.
 */
export interface TreeItemProps extends Omit<TreeRowProps, "children"> {
  /** Leading icon (node/kind icon). */
  icon?: ReactNode
  /** Display name; shown unless `rename.editing`. */
  name: string
  /** Extra classes on the clickable name button (selection colour, dimming). */
  nameButtonClassName?: string
  /** Extra classes on the name text span (strikethrough/italic/colour). */
  nameClassName?: string
  /** Click on the name region. Raw event so callers can read shift/meta keys. */
  onActivate?: (event: ReactMouseEvent) => void
  /** Double-click on the name region (e.g. start rename). */
  onActivateDoubleClick?: () => void
  /** Inline rename; omit when the row isn't renamable. */
  rename?: TreeItemRename
  /** Badges shown after the name, inside the clickable area. */
  inlineEnd?: ReactNode
  /** Trailing actions (visibility / lock). The caller owns hover/opacity classes. */
  trailing?: ReactNode
  /** `<ContextMenuContent>…`. When set, the row is wrapped in a `ContextMenu`. */
  contextMenuContent?: ReactNode
}

function TreeItem({
  icon,
  name,
  nameButtonClassName,
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
    <TreeRow ref={ref} {...rowProps}>
      <button
        type="button"
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left text-xs",
          nameButtonClassName,
        )}
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
              if (isImeComposing(e.nativeEvent)) return
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") rename.onCancel()
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            autoFocus
            className={cn("min-w-0 flex-1", rename.inputClassName)}
          />
        ) : (
          <span className={cn("flex-1 truncate", nameClassName)}>{name}</span>
        )}
        {inlineEnd}
      </button>
      {trailing}
    </TreeRow>
  )

  if (!contextMenuContent) return row
  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      {contextMenuContent}
    </ContextMenu>
  )
}

export { TreeItem }
