'use client';

import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { XIcon, type XIconHandle } from '@/registry/bases/base-ui/ui/x';
import { cn } from '@/registry/bases/base-ui/lib/utils';

interface TagInputProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** The tags, in order; a duplicate is never added. */
  value: string[];
  /** Called with the whole next tag array on every add or remove. */
  onValueChange: (value: string[]) => void;
  /** Placeholder copy for the input. */
  placeholder?: string;
  disabled?: boolean;
}

/**
 * A simple tag editor: existing tags as `Badge` chips above an `Input` that
 * commits on Enter / comma / blur. Pressing a chip removes its tag, and
 * Backspace on an empty input drops the last tag. Controlled - the consumer
 * owns the tag array and supplies any placeholder copy. Other props land on the
 * root `div`.
 */
function TagInput({ value, onValueChange, placeholder, disabled, className, ...props }: TagInputProps): ReactNode {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onValueChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onValueChange(value.slice(0, -1));
    }
  };

  return (
    <div data-slot="tag-input" className={cn('flex flex-col gap-2', className)} {...props}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <TagInputTag
              key={tag}
              disabled={disabled}
              aria-label={`Remove ${tag}`}
              onClick={() => onValueChange(value.filter((t) => t !== tag))}
            >
              {tag}
            </TagInputTag>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * One tag: a secondary `Badge` rendered as the button that removes it, with its
 * cross after the label (upstream's inline-end badge icon). The cross plays on
 * the chip's hover or focus.
 */
function TagInputTag({ children, ...props }: ComponentProps<'button'>): ReactNode {
  const iconRef = useRef<XIconHandle>(null);
  return (
    <Badge
      variant="secondary"
      render={
        <button
          type="button"
          data-slot="tag-input-tag"
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
          onFocus={() => iconRef.current?.startAnimation()}
          onBlur={() => iconRef.current?.stopAnimation()}
          {...props}
        />
      }
    >
      {children}
      <XIcon ref={iconRef} size={12} data-icon="inline-end" aria-hidden />
    </Badge>
  );
}

export { TagInput };
export type { TagInputProps };
