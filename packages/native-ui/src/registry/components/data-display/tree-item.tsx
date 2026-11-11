import { Slot } from '@rn-primitives/slot';
import { ChevronRight } from 'lucide-react-native';
import { createContext, useContext, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { Pressable, View, type TextInputInstance } from 'react-native';
import { asText } from '../../lib/text-children';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Input } from '../../ui/input';
import { TextClassContext } from '../../ui/text';

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text classes; the
// registry build replaces each with the classes translated for the target engine.

/** Whether the row is open and whether it is a leaf, which the web reads off the row's `data-expanded` and `data-leaf`. */
interface TreeItemContextValue {
  expanded: boolean;
  leaf: boolean;
}

const TreeItemContext = createContext<TreeItemContextValue | null>(null);

type TreeItemProps = ComponentProps<typeof View> & {
  /** Whether the node's children are shown; the trigger is announced expanded and its chevron turns down. */
  expanded?: boolean;
  /** Whether the node has no children; its indent holds the trigger's room, so its name lines up with its siblings'. */
  leaf?: boolean;
  /** Whether the row is being renamed. A device draws nothing for it; the row grows to fit the rename input. */
  editing?: boolean;
  /** Renders the single child in place of a View, such as a Pressable that selects the row, with the row's classes merged onto it. */
  asChild?: boolean;
};

/**
 * One row of a hierarchy tree (a layer tree, a scene outliner, a file tree), drawn as File Tree draws its rows:
 * the style's row height, rounded, on one line, so a long name truncates. The consumer composes the rest:
 *
 *   <TreeItem expanded={open}>
 *     <TreeItemIndent depth={0}>
 *       <TreeItemTrigger aria-label="Toggle src" onPress={toggle} />
 *     </TreeItemIndent>
 *     <TreeItemLabel>src</TreeItemLabel>
 *   </TreeItem>
 *   <TreeItem leaf>
 *     <TreeItemIndent depth={1} />
 *     <TreeItemLabel>index.ts</TreeItemLabel>
 *   </TreeItem>
 *
 * A `TreeItemRenameInput` replaces the label's text while renaming. Trailing actions go in the row; with
 * `asChild` a Pressable child makes the whole row take a press for selection, and a press on the trigger or on
 * a trailing button still reaches that control alone. A context menu wraps the row in a `ContextMenuTrigger`.
 */
function TreeItem({
  expanded = false,
  leaf = false,
  editing: _editing = false,
  asChild = false,
  className,
  ...props
}: TreeItemProps): ReactNode {
  const context = useMemo(() => ({ expanded, leaf }), [expanded, leaf]);
  const Component = asChild ? Slot : View;
  return (
    <TreeItemContext.Provider value={context}>
      <TextClassContext.Provider value="cn-tree-item/text text-foreground/80">
        <Component
          className={cn('cn-tree-item w-full min-w-0 flex-row items-center gap-1.5 ps-1.5 pe-2', className)}
          {...props}
        />
      </TextClassContext.Provider>
    </TreeItemContext.Provider>
  );
}

type TreeItemIndentProps = ComponentProps<typeof View> & {
  /** Nesting depth; 0 for roots. Each level indents 12px, the web's three spacing steps. */
  depth: number;
};

/**
 * The row's leading column, first in a `TreeItem`: a depth indent of 12px per level, then its `children`, a
 * folder row's `TreeItemTrigger`. On a `leaf` row it holds the room the trigger takes instead, hidden from
 * touch and from screen readers, so a leaf's name lines up with its folder siblings' names.
 */
function TreeItemIndent({ depth, className, style, children, ...props }: TreeItemIndentProps): ReactNode {
  const leaf = useContext(TreeItemContext)?.leaf ?? false;
  return (
    <View
      className={cn('shrink-0 flex-row items-center', className)}
      style={[{ paddingStart: depth * 12 }, style]}
      {...props}
    >
      {leaf ? (
        <View aria-hidden pointerEvents="none" className="opacity-0">
          <Button variant="ghost" size="icon-xs" disabled />
        </View>
      ) : null}
      {children}
    </View>
  );
}

/**
 * The disclosure control of a folder row: a link `icon-xs` Button, which has no expanded fill, holding a chevron
 * that turns down while the row is `expanded`, announced expanded or collapsed with it. Give it an `aria-label`
 * and an `onPress`; a press on it reaches it alone, so it never selects the row. It goes in the row's
 * `TreeItemIndent`, and a leaf row leaves it out.
 * @throws {Error} when rendered outside a TreeItem
 */
function TreeItemTrigger({ accessibilityState, ...props }: Omit<ComponentProps<typeof Button>, 'children'>): ReactNode {
  const context = useContext(TreeItemContext);
  if (!context) throw new Error('TreeItemTrigger must be used within <TreeItem>');
  const { expanded } = context;
  return (
    <Button
      variant="link"
      size="icon-xs"
      aria-expanded={expanded}
      accessibilityState={{ ...accessibilityState, expanded }}
      {...props}
    >
      {/* Not every engine turns an svg by its className, so the chevron turns in a View around it. */}
      <View className={cn(expanded && 'rotate-90')}>
        <Icon as={ChevronRight} />
      </View>
    </Button>
  );
}

/**
 * The row's name region: the consumer's icon and name as `children`, or a `TreeItemRenameInput` while renaming,
 * and any badges after the name. A string child is drawn on one line, truncated. `onPress` receives the press
 * event. It is one element to a screen reader only while it takes a press, so the rename input inside it stays
 * reachable.
 */
function TreeItemLabel({
  className,
  children,
  accessible,
  onPress,
  onLongPress,
  ...props
}: ComponentProps<typeof Pressable>): ReactNode {
  return (
    <Pressable
      accessible={accessible ?? (onPress !== undefined || onLongPress !== undefined)}
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn('min-w-0 flex-1 flex-row items-center gap-1.5', className)}
      {...props}
    >
      {asText(children, { numberOfLines: 1 })}
    </Pressable>
  );
}

type TreeItemRenameInputProps = ComponentProps<typeof Input> & {
  /** Called when the field is left, which the return key does: apply the draft. */
  onCommit: () => void;
  /** Called on Escape, where the keyboard reports it: drop the draft. */
  onCancel: () => void;
};

/**
 * The inline rename input, focused as it mounts. The return key commits by leaving the field, and leaving it
 * any other way commits too; Escape calls `onCancel` where the keyboard reports it, a hardware keyboard or the
 * web, and a caller's `onKeyPress` that calls `preventDefault` keeps Escape from it. A press on it stays in
 * it, so it never selects the row. The consumer owns the draft as `value` and `onChangeText`.
 */
function TreeItemRenameInput({
  onCommit,
  onCancel,
  onBlur,
  onSubmitEditing,
  onKeyPress,
  className,
  ref,
  ...props
}: TreeItemRenameInputProps): ReactNode {
  const input = useRef<TextInputInstance | null>(null);
  return (
    <Input
      ref={(node: TextInputInstance | null) => {
        input.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      autoFocus
      className={cn('min-w-0 flex-1', className)}
      onBlur={(event) => {
        onBlur?.(event);
        onCommit();
      }}
      onSubmitEditing={(event) => {
        onSubmitEditing?.(event);
        // A caller's submitBehavior can keep the field focused; the return key still commits by leaving it.
        input.current?.blur();
      }}
      onKeyPress={(event) => {
        onKeyPress?.(event);
        if (!event.isDefaultPrevented() && event.nativeEvent.key === 'Escape') onCancel();
      }}
      {...props}
    />
  );
}

export { TreeItem, TreeItemIndent, TreeItemTrigger, TreeItemLabel, TreeItemRenameInput };
export type { TreeItemProps, TreeItemIndentProps, TreeItemRenameInputProps };
