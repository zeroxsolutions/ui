import { X } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
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
 * A simple tag editor: existing tags as removable `Badge` chips above an `Input`
 * that commits on Enter / comma / blur. Backspace on an empty input drops the
 * last tag. Controlled - the consumer owns the tag array and supplies any
 * placeholder copy. Other props land on the root `div`.
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
    <div data-slot="tag-input" className={cn('space-y-2', className)} {...props}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onValueChange(value.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-muted-foreground hover:text-foreground rounded-full"
                disabled={disabled}
              >
                <X />
              </Button>
            </Badge>
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

export { TagInput };
export type { TagInputProps };
