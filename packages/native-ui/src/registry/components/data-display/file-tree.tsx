import { ChevronRight } from 'lucide-react-native';
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { Platform, Pressable, View, type GestureResponderEvent, type KeyDownEvent } from 'react-native';
import { useFocusVisible } from '../../lib/focus-visible';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Icon } from '../../ui/icon';
import { TextClassContext } from '../../ui/text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text classes; the
// registry build replaces each with the classes translated for the target engine.

type ViewInstance = ComponentRef<typeof View>;

/** What the tree knows of one rendered item, which the arrow keys walk in place of the web's DOM query. */
interface FileTreeEntry {
  value: string;
  level: number;
  folder: boolean;
  expanded: boolean;
  /** The item's position among its container's children, then theirs, down from the root. */
  path: readonly number[];
  focus: () => void;
}

interface FileTreeContextValue {
  selectedValue: string | undefined;
  select: (value: string) => void;
  isExpanded: (value: string) => boolean;
  toggleExpanded: (value: string) => void;
  /** The one item Tab reaches, kept in step with the item that last held focus. */
  activeValue: string | undefined;
  setActiveValue: (value: string) => void;
  /** Adds a rendered item to the list the keys walk; the returned function takes it out. */
  register: (entry: FileTreeEntry) => () => void;
  /** Called by the item focus goes to whenever it gains or loses focus. */
  setFocusedValue: (value: string | undefined) => void;
  focusedValue: () => string | undefined;
  /** Moves focus to an item, making it the one Tab reaches. */
  focusItem: (value: string) => void;
  /** Called by an item once it is the one Tab reaches, which focuses it if focus was asked for meanwhile. */
  focusIfAsked: (value: string) => void;
}

const FileTreeContext = createContext<FileTreeContextValue | null>(null);

function useFileTree(): FileTreeContextValue {
  const context = useContext(FileTreeContext);
  if (!context) throw new Error('FileTree parts must be used within <FileTree>');
  return context;
}

/** 1-based depth, incremented by every nested FileTreeGroup, for `aria-level` and the indent. */
const FileTreeDepthContext = createContext(1);

/** The position the enclosing FileTree or FileTreeGroup gave the child an item sits in. */
const FileTreePathContext = createContext<readonly number[]>([]);

interface FileTreeItemContextValue {
  value: string;
  level: number;
  folder: boolean;
  expanded: boolean;
  selected: boolean;
  tabbable: boolean;
  /** Whether the item's row holds focus that came from the keyboard. */
  focusVisible: boolean;
  labelId: string;
  /** The row takes the item's focus on a device, where the item itself is no element of its own to a screen reader. */
  target: RefObject<ViewInstance | null>;
  onTargetFocus: (event: unknown) => void;
  onTargetBlur: () => void;
}

const FileTreeItemContext = createContext<FileTreeItemContextValue | null>(null);

function useFileTreeItem(): FileTreeItemContextValue {
  const context = useContext(FileTreeItemContext);
  if (!context) throw new Error('FileTreeLabel / FileTreeGroup must be used within <FileTreeItem>');
  return context;
}

function comparePaths(a: readonly number[], b: readonly number[]): number {
  const shared = Math.min(a.length, b.length);
  for (let index = 0; index < shared; index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return a.length - b.length;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/** Gives each child the position it holds among its siblings, after `base`, for the keys' order. */
function withPaths(children: ReactNode, base: readonly number[]): ReactNode {
  return Children.map(children, (child, index) => (
    <FileTreePathContext.Provider value={[...base, index]}>{child}</FileTreePathContext.Provider>
  ));
}

/** WAI-ARIA APG Tree View keyboard handling (single-select), over the rendered items in tree order. */
function handleTreeKey(key: string, items: readonly FileTreeEntry[], tree: FileTreeContextValue): boolean {
  if (items.length === 0) return false;
  const focusedValue = tree.focusedValue();
  const index = items.findIndex((item) => item.value === focusedValue);
  const current = index < 0 ? undefined : items[index];
  const focus = (item: FileTreeEntry | undefined): void => {
    if (item) tree.focusItem(item.value);
  };

  switch (key) {
    case 'ArrowDown':
      focus(index < 0 ? items[0] : items[Math.min(index + 1, items.length - 1)]);
      return true;
    case 'ArrowUp':
      focus(index <= 0 ? items[0] : items[index - 1]);
      return true;
    case 'Home':
      focus(items[0]);
      return true;
    case 'End':
      focus(items[items.length - 1]);
      return true;
    case 'ArrowRight':
      if (!current) return false;
      if (current.folder && !current.expanded) tree.toggleExpanded(current.value);
      else if (current.folder) focus(items[index + 1]);
      return true;
    case 'ArrowLeft':
      if (!current) return false;
      if (current.folder && current.expanded) {
        tree.toggleExpanded(current.value);
      } else {
        let parent = index - 1;
        while (parent >= 0 && items[parent].level >= current.level) parent--;
        focus(items[parent]);
      }
      return true;
    case 'Enter':
    case ' ':
      if (!current) return false;
      tree.select(current.value);
      if (current.folder) tree.toggleExpanded(current.value);
      return true;
    default:
      return false;
  }
}

type FileTreeProps = ComponentProps<typeof View> & {
  /** Selected item value (controlled). */
  value?: string;
  /** Initially-selected value (uncontrolled). */
  defaultValue?: string;
  /** Called with the value of every item selected, controlled or not. */
  onValueChange?: (value: string) => void;
  /** Expanded folder values (controlled). */
  expanded?: string[];
  /** Initially-expanded folder values (uncontrolled). */
  defaultExpanded?: string[];
  /** Called with the whole expanded set on every open or close, controlled or not. */
  onExpandedChange?: (expanded: string[]) => void;
};

// `TreeItem` (data-display/tree-item) draws a similar row and is kept a separate tree until a change shows the two
// move together.
/**
 * An accessible file tree (WAI-ARIA APG Tree View) for navigating a file bundle. The root owns selection and
 * folder expansion, each controlled when its prop is given and uncontrolled from its default otherwise, and
 * drives the keyboard where the platform reports keys, the web and a hardware keyboard: Up, Down, Home and End
 * move, Left and Right collapse and expand, Enter and Space select. A press on a row selects it and toggles a
 * folder. The consumer composes `FileTreeItem`, `FileTreeLabel` and `FileTreeGroup` and owns every visible label
 * and icon. Ships no copy, so give the root an `aria-label`. A caller's `onKeyDown` runs first, and one that calls
 * `preventDefault` keeps the key from the tree.
 */
function FileTree({
  value: valueProp,
  defaultValue,
  onValueChange,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  className,
  children,
  onKeyDown,
  ...props
}: FileTreeProps): ReactNode {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = valueProp ?? uncontrolledValue;
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  const expandedList = expandedProp ?? uncontrolledExpanded;
  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);
  const [activeValue, setActiveValue] = useState<string | undefined>(valueProp ?? defaultValue);
  const entries = useRef(new Map<string, { entry: FileTreeEntry; order: number }>());
  const registrations = useRef(0);
  const focused = useRef<string | undefined>(undefined);
  const pendingFocus = useRef<string | undefined>(undefined);

  const visibleItems = useCallback(
    (): FileTreeEntry[] =>
      [...entries.current.values()]
        .sort((a, b) => comparePaths(a.entry.path, b.entry.path) || a.order - b.order)
        .map(({ entry }) => entry),
    [],
  );

  const tree: FileTreeContextValue = {
    selectedValue,
    select: (next) => {
      if (valueProp === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    isExpanded: (item) => expandedSet.has(item),
    toggleExpanded: (item) => {
      const next = new Set(expandedSet);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      const list = [...next];
      if (expandedProp === undefined) setUncontrolledExpanded(list);
      onExpandedChange?.(list);
    },
    activeValue,
    setActiveValue,
    register: (entry) => {
      const record = { entry, order: registrations.current++ };
      entries.current.set(entry.value, record);
      return () => {
        if (entries.current.get(entry.value) === record) entries.current.delete(entry.value);
      };
    },
    setFocusedValue: (item) => {
      focused.current = item;
    },
    focusedValue: () => focused.current,
    focusItem: (item) => {
      if (activeValue === item) {
        entries.current.get(item)?.entry.focus();
        return;
      }
      // A row that is not the one Tab reaches cannot take focus on Android, so it is focused once it is.
      pendingFocus.current = item;
      setActiveValue(item);
    },
    focusIfAsked: (item) => {
      if (pendingFocus.current !== item) return;
      pendingFocus.current = undefined;
      entries.current.get(item)?.entry.focus();
    },
  };

  // Keep exactly one item reachable by Tab: the active one, or the first rendered item when the active one is
  // absent, such as inside a collapsed folder. Runs after every render, once the items have registered.
  useEffect(() => {
    const items = visibleItems();
    if (items.length === 0) return;
    if (activeValue === undefined || !items.some((item) => item.value === activeValue)) {
      setActiveValue(items[0].value);
    }
  });

  return (
    <FileTreeContext.Provider value={tree}>
      <FileTreeDepthContext.Provider value={1}>
        <TextClassContext.Provider value="cn-file-tree/text">
          <View
            role="tree"
            className={cn('cn-file-tree', className)}
            onKeyDown={(event: KeyDownEvent) => {
              onKeyDown?.(event);
              if (event.isDefaultPrevented()) return;
              if (handleTreeKey(event.nativeEvent.key, visibleItems(), tree)) event.preventDefault();
            }}
            {...props}
          >
            {withPaths(children, [])}
          </View>
        </TextClassContext.Provider>
      </FileTreeDepthContext.Provider>
    </FileTreeContext.Provider>
  );
}

type FileTreeItemProps = ComponentProps<typeof View> & {
  /** Stable identifier, typically the file path. */
  value: string;
};

/**
 * A node in a `FileTree`. It is a folder when a `FileTreeGroup` is one of its direct children, and a folder is
 * announced expanded or collapsed; otherwise it is a leaf. Its row is a `FileTreeLabel`; nested children go in a
 * `FileTreeGroup`. On the web it is the tree item a screen reader and the keyboard reach, named by its row; on a
 * device the row is, since a device reads an element with children inside it as one.
 */
function FileTreeItem({ value, className, children, onFocus, onBlur, ref, ...props }: FileTreeItemProps): ReactNode {
  const tree = useFileTree();
  const level = useContext(FileTreeDepthContext);
  const path = useContext(FileTreePathContext);
  const labelId = useId();
  const web = Platform.OS === 'web';
  const target = useRef<ViewInstance | null>(null);
  const { focusVisible, onFocus: focusVisibleOnFocus, onBlur: focusVisibleOnBlur } = useFocusVisible();
  const folder = useMemo(
    () => Children.toArray(children).some((child) => isValidElement(child) && child.type === FileTreeGroup),
    [children],
  );
  const expanded = folder && tree.isExpanded(value);
  const selected = tree.selectedValue === value;
  const tabbable = tree.activeValue === value;
  const { register, focusIfAsked } = tree;
  const pathKey = path.join('.');

  useLayoutEffect(
    () => register({ value, level, folder, expanded, path, focus: () => target.current?.focus() }),
    [value, level, folder, expanded, pathKey],
  );

  useLayoutEffect(() => {
    if (tabbable) focusIfAsked(value);
  }, [tabbable]);

  const onTargetFocus = (event: unknown): void => {
    tree.setActiveValue(value);
    tree.setFocusedValue(value);
    focusVisibleOnFocus(event);
  };
  const onTargetBlur = (): void => {
    if (tree.focusedValue() === value) tree.setFocusedValue(undefined);
    focusVisibleOnBlur();
  };

  const item: FileTreeItemContextValue = {
    value,
    level,
    folder,
    expanded,
    selected,
    tabbable,
    focusVisible,
    labelId,
    target,
    onTargetFocus,
    onTargetBlur,
  };

  const webTreeItem = web
    ? ({
        role: 'treeitem',
        'aria-level': level,
        'aria-selected': selected,
        'aria-expanded': folder ? expanded : undefined,
        'aria-labelledby': labelId,
        focusable: tabbable,
      } as const)
    : {};

  return (
    <FileTreeItemContext.Provider value={item}>
      <View
        ref={(node: ViewInstance | null) => {
          if (web) target.current = node;
          assignRef(ref, node);
        }}
        {...webTreeItem}
        className={cn(web && 'outline-none', className)}
        onFocus={(event) => {
          onFocus?.(event);
          // The web reports a row's or a nested item's focus here too; only the item's own counts.
          if (web && event.target === event.currentTarget) onTargetFocus(event);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (web && event.target === event.currentTarget) onTargetBlur();
        }}
        {...props}
      >
        {children}
      </View>
    </FileTreeItemContext.Provider>
  );
}

type FileTreeLabelProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  /** The consumer's icon and file name. */
  children?: ReactNode;
};

/**
 * The pressable row of a `FileTreeItem`: a chevron on a folder, turned down while it is open, then the consumer's
 * icon and file name as `children`, indented by depth; a string child is drawn on one line. A press selects the
 * item and toggles a folder, after a caller's `onPress`. It is filled while selected and ringed while its item
 * holds focus from the keyboard. On a device it is the tree item a screen reader reaches, announced selected, and
 * a folder's expanded or collapsed.
 * @throws {Error} when rendered outside a FileTreeItem
 */
function FileTreeLabel({
  className,
  children,
  style,
  onPress,
  onFocus,
  onBlur,
  ref,
  ...props
}: FileTreeLabelProps): ReactNode {
  const tree = useFileTree();
  const item = useFileTreeItem();
  const web = Platform.OS === 'web';
  const indent = (item.level - 1) * 12 + 6;

  const deviceTreeItem = web
    ? // A click on the row would otherwise focus it rather than its item, as a browser focuses the item it is in.
      ({ tabIndex: -1 } as const)
    : ({
        accessible: true,
        role: 'treeitem',
        'aria-selected': item.selected,
        'aria-expanded': item.folder ? item.expanded : undefined,
        tabIndex: item.tabbable ? 0 : -1,
      } as const);

  return (
    <TextClassContext.Provider
      value={cn(
        'cn-file-tree/text cn-file-tree-item/text text-foreground/80',
        item.selected && 'text-foreground font-sans-medium',
      )}
    >
      <Pressable
        ref={(node: ViewInstance | null) => {
          if (!web) item.target.current = node;
          assignRef(ref, node);
        }}
        nativeID={item.labelId}
        {...deviceTreeItem}
        className={cn(
          'cn-file-tree-item flex-row items-center gap-1.5 pr-2',
          item.selected && 'bg-muted',
          item.focusVisible && 'border-ring/50 border-[3px]',
          className,
        )}
        style={
          typeof style === 'function'
            ? (state) => [{ paddingStart: indent }, style(state)]
            : [{ paddingStart: indent }, style]
        }
        onPress={(event: GestureResponderEvent) => {
          onPress?.(event);
          tree.setActiveValue(item.value);
          tree.select(item.value);
          if (item.folder) tree.toggleExpanded(item.value);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (web) item.target.current?.focus();
          else item.onTargetFocus(event);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          if (!web) item.onTargetBlur();
        }}
        {...props}
      >
        {item.folder ? (
          // Not every engine turns an svg by its className, so the chevron turns in a View around it.
          <View aria-hidden className={cn('shrink-0', item.expanded && 'rotate-90')}>
            <Icon as={ChevronRight} size={16} className="text-primary" />
          </View>
        ) : (
          <View aria-hidden className="w-4 shrink-0" />
        )}
        {asText(children, { numberOfLines: 1 })}
      </Pressable>
    </TextClassContext.Provider>
  );
}

type FileTreeGroupProps = ComponentProps<typeof View>;

/**
 * The nested children of a folder `FileTreeItem`. Rendered only while its item is expanded; deepens the level of
 * the items inside it.
 * @throws {Error} when rendered outside a FileTreeItem
 */
function FileTreeGroup({ className, children, ...props }: FileTreeGroupProps): ReactNode {
  const item = useFileTreeItem();
  const path = useContext(FileTreePathContext);
  if (!item.expanded) return null;
  return (
    <FileTreeDepthContext.Provider value={item.level + 1}>
      <View role="group" className={className} {...props}>
        {withPaths(children, path)}
      </View>
    </FileTreeDepthContext.Provider>
  );
}

export { FileTree, FileTreeItem, FileTreeLabel, FileTreeGroup };
export type { FileTreeProps, FileTreeItemProps, FileTreeLabelProps, FileTreeGroupProps };
