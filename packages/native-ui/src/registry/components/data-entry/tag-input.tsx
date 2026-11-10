import { X } from 'lucide-react-native';
import { Children, createContext, useContext, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { Input } from '../../ui/input';
import { Text } from '../../ui/text';

interface TagInputContextValue {
  value: string[];
  disabled: boolean;
  /** Appends each trimmed, non-empty tag the list does not hold yet, in one change. */
  add: (...tags: string[]) => void;
  remove: (tag: string) => void;
}

const TagInputContext = createContext<TagInputContextValue | null>(null);

function useTagInput(): TagInputContextValue {
  const context = useContext(TagInputContext);
  if (!context) throw new Error('TagInput parts must be used within <TagInput>');
  return context;
}

type TagInputProps = ComponentProps<typeof View> & {
  /** The tags, in order; a duplicate is never added. */
  value: string[];
  /** Called with the whole next tag array on every add or remove. */
  onValueChange: (value: string[]) => void;
  /** Disables every part's control. */
  disabled?: boolean;
};

/**
 * A tag editor: the root owns the tag array (controlled) and hands adding and removing to its parts, which the
 * caller composes:
 *
 *   <TagInput value={tags} onValueChange={setTags}>
 *     <TagInputList>
 *       {tags.map((tag) => (
 *         <TagInputTag key={tag} value={tag}>
 *           {tag}
 *           <TagInputTagRemove aria-label={`Remove ${tag}`} />
 *         </TagInputTag>
 *       ))}
 *     </TagInputList>
 *     <TagInputInput aria-label="Add a tag" placeholder="Add a tag" />
 *   </TagInput>
 *
 * Other props land on the root View.
 */
function TagInput({ value, onValueChange, disabled = false, className, ...props }: TagInputProps): ReactNode {
  const context = useMemo<TagInputContextValue>(
    () => ({
      value,
      disabled,
      add: (...tags): void => {
        const next = [...value];
        for (const tag of tags) {
          const trimmed = tag.trim();
          if (trimmed && !next.includes(trimmed)) next.push(trimmed);
        }
        if (next.length > value.length) onValueChange(next);
      },
      remove: (tag): void => onValueChange(value.filter((t) => t !== tag)),
    }),
    [value, disabled, onValueChange],
  );
  return (
    <TagInputContext.Provider value={context}>
      <View className={cn('flex-col gap-2', className)} {...props} />
    </TagInputContext.Provider>
  );
}

/** The row the tags wrap in; it draws nothing while it holds no tag. */
function TagInputList({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  if (Children.count(children) === 0) return null;
  return (
    <View className={cn('flex-row flex-wrap gap-1.5', className)} {...props}>
      {children}
    </View>
  );
}

const TagInputTagContext = createContext<string | null>(null);

type TagInputTagProps = ComponentProps<typeof Badge> & {
  /** The tag this chip stands for; its TagInputTagRemove removes it. */
  value: string;
};

/**
 * One tag, a secondary Badge: the label, then its TagInputTagRemove. A string or number child is drawn in a Text,
 * which a View cannot hold bare, so the label goes in as the web's does.
 */
function TagInputTag({ value, children, ...props }: TagInputTagProps): ReactNode {
  return (
    <TagInputTagContext.Provider value={value}>
      <Badge variant="secondary" {...props}>
        {Children.map(children, (child) =>
          typeof child === 'string' || typeof child === 'number' ? <Text>{child}</Text> : child,
        )}
      </Badge>
    </TagInputTagContext.Provider>
  );
}

/**
 * The tag's remove button, a ghost `icon-xs` Button drawing a cross, announced as a button. The caller names it
 * with `aria-label`. Disabled with the root. An `onPress` runs first, and one that calls `preventDefault` keeps the tag.
 * @throws {Error} when rendered outside a TagInputTag
 */
function TagInputTagRemove({ onPress, ...props }: Omit<ComponentProps<typeof Button>, 'children'>): ReactNode {
  const { disabled, remove } = useTagInput();
  const tag = useContext(TagInputTagContext);
  if (tag === null) throw new Error('TagInputTagRemove must be used within <TagInputTag>');
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={disabled}
      onPress={(event) => {
        onPress?.(event);
        if (!event.isDefaultPrevented()) remove(tag);
      }}
      {...props}
    >
      <Icon as={X} />
    </Button>
  );
}

/**
 * The draft input, an Input that keeps the draft itself. The return key adds the draft as a tag and keeps the
 * field focused for the next one; a comma adds the text before it, so a pasted `a, b, c` adds each; leaving the
 * field adds what is left. Backspace in an empty draft removes the last tag where the keyboard reports it, which
 * Android's soft keyboards do not. Takes the Input's own props (`placeholder`, `aria-label`). Disabled with the root.
 * @throws {Error} when rendered outside a TagInput
 */
function TagInputInput({
  onChangeText,
  onSubmitEditing,
  onKeyPress,
  onBlur,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'defaultValue'>): ReactNode {
  const { value, disabled, add, remove } = useTagInput();
  const [draft, setDraft] = useState('');

  const commit = (): void => {
    add(draft);
    setDraft('');
  };

  return (
    <Input
      value={draft}
      editable={disabled ? false : undefined}
      submitBehavior="submit"
      onChangeText={(text) => {
        onChangeText?.(text);
        const parts = text.split(',');
        const rest = parts.pop() ?? '';
        if (parts.length > 0) add(...parts);
        setDraft(rest);
      }}
      onSubmitEditing={(event) => {
        onSubmitEditing?.(event);
        commit();
      }}
      onKeyPress={(event) => {
        onKeyPress?.(event);
        if (event.isDefaultPrevented()) return;
        const last = value[value.length - 1];
        if (event.nativeEvent.key === 'Backspace' && draft === '' && last !== undefined) remove(last);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        commit();
      }}
      {...props}
    />
  );
}

export { TagInput, TagInputList, TagInputTag, TagInputTagRemove, TagInputInput };
export type { TagInputProps, TagInputTagProps };
