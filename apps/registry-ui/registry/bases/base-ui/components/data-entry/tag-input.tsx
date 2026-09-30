'use client';

import * as React from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { XIcon, type XIconHandle } from '@/registry/bases/base-ui/ui/x';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TagInputContextValue {
  value: string[];
  disabled: boolean;
  /** Appends a trimmed, non-empty tag the list does not hold yet. */
  add: (tag: string) => void;
  remove: (tag: string) => void;
}

const TagInputContext = React.createContext<TagInputContextValue | null>(null);

function useTagInput(): TagInputContextValue {
  const context = React.useContext(TagInputContext);
  if (!context) throw new Error('TagInput parts must be used within <TagInput>');
  return context;
}

interface TagInputProps extends Omit<React.ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** The tags, in order; a duplicate is never added. */
  value: string[];
  /** Called with the whole next tag array on every add or remove. */
  onValueChange: (value: string[]) => void;
  /** Disables every part's control; sets `data-disabled`. */
  disabled?: boolean;
}

/**
 * A tag editor: the root owns the tag array (controlled) and hands adding and
 * removing to its parts, which the consumer composes:
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
 *     <TagInputInput placeholder="Add a tag" />
 *   </TagInput>
 *
 * Other props land on the root `div`.
 */
function TagInput({ value, onValueChange, disabled = false, className, ...props }: TagInputProps): React.ReactNode {
  const context = React.useMemo<TagInputContextValue>(
    () => ({
      value,
      disabled,
      add: (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !value.includes(trimmed)) onValueChange([...value, trimmed]);
      },
      remove: (tag) => onValueChange(value.filter((t) => t !== tag)),
    }),
    [value, disabled, onValueChange],
  );
  return (
    <TagInputContext.Provider value={context}>
      <div
        data-slot="tag-input"
        data-disabled={disabled || undefined}
        className={cn('flex flex-col gap-2', className)}
        {...props}
      />
    </TagInputContext.Provider>
  );
}

/** The row the tags wrap in; it takes no room while it holds no tag. */
function TagInputList({ className, ...props }: React.ComponentProps<'div'>): React.ReactNode {
  return <div data-slot="tag-input-list" className={cn('flex flex-wrap gap-1.5 empty:hidden', className)} {...props} />;
}

const TagInputTagContext = React.createContext<string | null>(null);

interface TagInputTagProps extends React.ComponentProps<typeof Badge> {
  /** The tag this chip stands for; its `TagInputTagRemove` removes it. */
  value: string;
}

/**
 * One tag, an upstream secondary `Badge`: the label as `children`, then its
 * `TagInputTagRemove`. Hand-built from `Badge` and `Button` rather than
 * upstream's `ComboboxChip`, whose remove button takes no accessible name.
 */
function TagInputTag({ value, ...props }: TagInputTagProps): React.ReactNode {
  return (
    <TagInputTagContext.Provider value={value}>
      <Badge data-slot="tag-input-tag" variant="secondary" {...props} />
    </TagInputTagContext.Provider>
  );
}

/**
 * The tag's remove button: a ghost `icon-xs` button at the badge's inline end
 * (`data-icon="inline-end"`, which the Badge recipe pads for). The caller
 * names it with `aria-label`. Disabled with the root. The cross plays on the
 * button's hover or focus.
 */
function TagInputTagRemove({
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'children'>): React.ReactNode {
  const { disabled, remove } = useTagInput();
  const tag = React.useContext(TagInputTagContext);
  const iconRef = React.useRef<XIconHandle>(null);
  if (tag === null) throw new Error('TagInputTagRemove must be used within <TagInputTag>');
  return (
    <Button
      data-slot="tag-input-tag-remove"
      type="button"
      variant="ghost"
      size="icon-xs"
      data-icon="inline-end"
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) remove(tag);
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
      <XIcon ref={iconRef} aria-hidden />
    </Button>
  );
}

/**
 * The draft input, upstream's `Input`: Enter, a comma or leaving the field adds
 * the draft as a tag, and Backspace in an empty draft removes the last tag. It
 * takes the Input's own props (`placeholder`, `aria-label`) and keeps the draft
 * itself. Disabled with the root.
 */
function TagInputInput({
  onKeyDown,
  onBlur,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'defaultValue' | 'onChange'>): React.ReactNode {
  const { value, disabled, add, remove } = useTagInput();
  const [draft, setDraft] = React.useState('');

  const commit = () => {
    add(draft);
    setDraft('');
  };

  return (
    <Input
      data-slot="tag-input-input"
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'Enter' || event.key === ',') {
          event.preventDefault();
          commit();
        } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
          remove(value[value.length - 1]);
        }
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
