import * as React from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Minimal controlled/uncontrolled state: uses `prop` when provided, otherwise an
 * internal state seeded from `defaultProp`. Mirrors the Base UI / Radix triad.
 */
function useControllableState<T>(opts: {
  prop: T | undefined;
  defaultProp: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const { prop, defaultProp, onChange } = opts;
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultProp);
  const controlled = prop !== undefined;
  const value = controlled ? (prop as T) : uncontrolled;
  const setValue = React.useCallback(
    (next: T) => {
      if (!controlled) setUncontrolled(next);
      onChange?.(next);
    },
    [controlled, onChange],
  );
  return [value, setValue];
}

interface FileTreeContextValue {
  selectedValue: string | undefined;
  select: (value: string) => void;
  isExpanded: (value: string) => boolean;
  setExpanded: (value: string, open: boolean) => void;
  toggleExpanded: (value: string) => void;
  activeValue: string | undefined;
  setActiveValue: (value: string) => void;
}

const FileTreeContext = React.createContext<FileTreeContextValue | null>(null);

function useFileTree(): FileTreeContextValue {
  const ctx = React.useContext(FileTreeContext);
  if (!ctx) throw new Error('FileTree parts must be used within <FileTree>');
  return ctx;
}

/** 1-based depth, incremented by every nested <FileTreeGroup> for `aria-level`. */
const DepthContext = React.createContext(1);

interface FileTreeItemContextValue {
  value: string;
  level: number;
  folder: boolean;
  expanded: boolean;
  selected: boolean;
  labelId: string;
}

const FileTreeItemContext = React.createContext<FileTreeItemContextValue | null>(
  null,
);

function useFileTreeItem(): FileTreeItemContextValue {
  const ctx = React.useContext(FileTreeItemContext);
  if (!ctx) {
    throw new Error(
      'FileTreeLabel / FileTreeGroup must be used within <FileTreeItem>',
    );
  }
  return ctx;
}

/** All currently-rendered (therefore visible) tree items, in DOM order. */
function visibleItems(root: HTMLElement): HTMLLIElement[] {
  return Array.from(root.querySelectorAll<HTMLLIElement>('[role="treeitem"]'));
}

function levelOf(el: HTMLElement): number {
  return Number(el.getAttribute('aria-level') ?? '1');
}

/** WAI-ARIA APG Tree View keyboard handling (single-select). */
function handleTreeKeyDown(
  event: React.KeyboardEvent,
  ctx: FileTreeContextValue,
): void {
  const root = event.currentTarget as HTMLElement;
  const items = visibleItems(root);
  if (items.length === 0) return;

  const current = (event.target as HTMLElement).closest<HTMLLIElement>(
    '[role="treeitem"]',
  );
  const index = current ? items.indexOf(current) : -1;

  const focus = (el: HTMLLIElement | undefined) => {
    if (!el) return;
    el.focus();
    if (el.dataset.value) ctx.setActiveValue(el.dataset.value);
  };

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focus(index < 0 ? items[0] : items[Math.min(index + 1, items.length - 1)]);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focus(index <= 0 ? items[0] : items[index - 1]);
      break;
    case 'Home':
      event.preventDefault();
      focus(items[0]);
      break;
    case 'End':
      event.preventDefault();
      focus(items[items.length - 1]);
      break;
    case 'ArrowRight': {
      if (!current) return;
      event.preventDefault();
      const isFolder = current.getAttribute('aria-expanded') !== null;
      if (!isFolder) return;
      if (current.getAttribute('aria-expanded') === 'false') {
        ctx.setExpanded(current.dataset.value!, true);
      } else {
        focus(items[index + 1]); // already open -> move to first child
      }
      break;
    }
    case 'ArrowLeft': {
      if (!current) return;
      event.preventDefault();
      const open =
        current.getAttribute('aria-expanded') === 'true';
      if (open) {
        ctx.setExpanded(current.dataset.value!, false);
      } else {
        const level = levelOf(current);
        for (let i = index - 1; i >= 0; i--) {
          if (levelOf(items[i]) < level) {
            focus(items[i]);
            break;
          }
        }
      }
      break;
    }
    case 'Enter':
    case ' ': {
      if (!current) return;
      event.preventDefault();
      const value = current.dataset.value!;
      ctx.select(value);
      if (current.getAttribute('aria-expanded') !== null) {
        ctx.toggleExpanded(value);
      }
      break;
    }
    default:
      break;
  }
}

interface FileTreeProps extends Omit<React.ComponentProps<'ul'>, 'onSelect'> {
  /** Selected item value (controlled). */
  value?: string;
  /** Initially-selected value (uncontrolled). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Expanded folder values (controlled). */
  expanded?: string[];
  /** Initially-expanded folder values (uncontrolled). */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
}

/**
 * An accessible **file tree** (WAI-ARIA APG Tree View) for navigating a file
 * bundle. Compound + context: the Root owns selection and folder expansion (both
 * controlled/uncontrolled triads) and drives keyboard navigation
 * (Up/Down/Home/End move, Left/Right collapse/expand, Enter/Space select); the
 * consumer composes `FileTreeItem` / `FileTreeLabel` / `FileTreeGroup` and owns
 * every visible label and icon. Ships no copy - give the Root an `aria-label`.
 */
function FileTree({
  value,
  defaultValue,
  onValueChange,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  className,
  children,
  onKeyDown,
  ...props
}: FileTreeProps) {
  const [selectedValue, select] = useControllableState<string | undefined>({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange as ((v: string | undefined) => void) | undefined,
  });
  const [expandedList, setExpandedList] = useControllableState<string[]>({
    prop: expanded,
    defaultProp: defaultExpanded,
    onChange: onExpandedChange,
  });
  const expandedSet = React.useMemo(
    () => new Set(expandedList),
    [expandedList],
  );
  const [activeValue, setActiveValue] = React.useState<string | undefined>(
    value ?? defaultValue,
  );
  const treeRef = React.useRef<HTMLUListElement>(null);

  const ctx: FileTreeContextValue = {
    selectedValue,
    select: (v) => select(v),
    isExpanded: (v) => expandedSet.has(v),
    setExpanded: (v, open) => {
      const next = new Set(expandedSet);
      if (open) next.add(v);
      else next.delete(v);
      setExpandedList(Array.from(next));
    },
    toggleExpanded: (v) => {
      const next = new Set(expandedSet);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      setExpandedList(Array.from(next));
    },
    activeValue,
    setActiveValue,
  };

  // Keep exactly one item tabbable (roving tabindex): the active one, or the
  // first visible item when the active one is absent (e.g. inside a collapsed
  // folder). Runs after every render; the guard prevents a state loop.
  React.useEffect(() => {
    const root = treeRef.current;
    if (!root) return;
    const items = visibleItems(root);
    if (items.length === 0) return;
    const hasActive =
      activeValue != null &&
      items.some((el) => el.dataset.value === activeValue);
    if (!hasActive && items[0].dataset.value) {
      setActiveValue(items[0].dataset.value);
    }
  });

  return (
    <FileTreeContext.Provider value={ctx}>
      <DepthContext.Provider value={1}>
        <ul
          role="tree"
          data-slot="file-tree"
          className={cn('select-none text-sm', className)}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (!e.defaultPrevented) handleTreeKeyDown(e, ctx);
          }}
          {...props}
          ref={treeRef}
        >
          {children}
        </ul>
      </DepthContext.Provider>
    </FileTreeContext.Provider>
  );
}

interface FileTreeItemProps extends React.ComponentProps<'li'> {
  /** Stable identifier - typically the file path. */
  value: string;
}

/**
 * A node in a `FileTree` (`li[role=treeitem]`). It's a **folder** when it
 * contains a `FileTreeGroup` (then it gets `aria-expanded`), otherwise a leaf.
 * Its row is a `FileTreeLabel`; nested children go in a `FileTreeGroup`.
 */
function FileTreeItem({
  value,
  className,
  children,
  onFocus,
  ...props
}: FileTreeItemProps) {
  const ctx = useFileTree();
  const level = React.useContext(DepthContext);
  const labelId = React.useId();
  const folder = React.useMemo(
    () =>
      React.Children.toArray(children).some(
        (child) => React.isValidElement(child) && child.type === FileTreeGroup,
      ),
    [children],
  );
  const expanded = folder && ctx.isExpanded(value);
  const selected = ctx.selectedValue === value;
  const tabbable = ctx.activeValue === value;

  const itemCtx: FileTreeItemContextValue = {
    value,
    level,
    folder,
    expanded,
    selected,
    labelId,
  };

  return (
    <FileTreeItemContext.Provider value={itemCtx}>
      <li
        role="treeitem"
        aria-level={level}
        aria-selected={selected}
        aria-expanded={folder ? expanded : undefined}
        aria-labelledby={labelId}
        data-slot="file-tree-item"
        data-value={value}
        data-folder={folder ? '' : undefined}
        data-selected={selected ? '' : undefined}
        tabIndex={tabbable ? 0 : -1}
        className={cn('group/treeitem outline-none', className)}
        onFocus={(e) => {
          onFocus?.(e);
          if (e.target === e.currentTarget) ctx.setActiveValue(value);
        }}
        {...props}
      >
        {children}
      </li>
    </FileTreeItemContext.Provider>
  );
}

type FileTreeLabelProps = React.ComponentProps<'div'>;

/**
 * The clickable row of a `FileTreeItem` - a chevron (folders only), the
 * consumer's icon + file name (`children`), indented by depth. Clicking selects
 * the item and toggles a folder. The focus ring follows the item's keyboard
 * focus; visible state is exposed via `data-selected`.
 */
function FileTreeLabel({
  className,
  children,
  onClick,
  ...props
}: FileTreeLabelProps) {
  const ctx = useFileTree();
  const item = useFileTreeItem();
  return (
    <div
      id={item.labelId}
      data-slot="file-tree-label"
      data-selected={item.selected ? '' : undefined}
      style={{ paddingInlineStart: `${(item.level - 1) * 12 + 6}px` }}
      className={cn(
        'flex h-7 cursor-pointer items-center gap-1.5 rounded-md pr-2 text-foreground/80 transition-colors',
        'hover:bg-muted hover:text-foreground',
        'group-focus-visible/treeitem:ring-2 group-focus-visible/treeitem:ring-ring/50',
        'data-[selected]:bg-muted data-[selected]:font-medium data-[selected]:text-foreground',
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        ctx.select(item.value);
        if (item.folder) ctx.toggleExpanded(item.value);
      }}
      {...props}
    >
      {item.folder ? (
        <ChevronRight
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            item.expanded && 'rotate-90',
          )}
        />
      ) : (
        <span aria-hidden className="w-4 shrink-0" />
      )}
      {children}
    </div>
  );
}

type FileTreeGroupProps = React.ComponentProps<'ul'>;

/**
 * The nested children of a folder `FileTreeItem` (`ul[role=group]`). Rendered
 * only while its parent item is expanded; deepens `aria-level` for descendants.
 */
function FileTreeGroup({
  className,
  children,
  ...props
}: FileTreeGroupProps) {
  const item = useFileTreeItem();
  if (!item.expanded) return null;
  return (
    <DepthContext.Provider value={item.level + 1}>
      <ul
        role="group"
        data-slot="file-tree-group"
        className={cn(className)}
        {...props}
      >
        {children}
      </ul>
    </DepthContext.Provider>
  );
}

export {
  FileTree,
  FileTreeItem,
  FileTreeLabel,
  FileTreeGroup,
};
export type {
  FileTreeProps,
  FileTreeItemProps,
  FileTreeLabelProps,
  FileTreeGroupProps,
};
