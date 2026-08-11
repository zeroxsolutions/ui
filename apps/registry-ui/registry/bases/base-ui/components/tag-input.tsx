import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { Badge } from '@/registry/bases/base-ui/ui/badge';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { cn } from '@/registry/bases/base-ui/lib/utils';

/**
 * A simple tag editor: existing tags as removable `Badge` chips above an `Input`
 * that commits on Enter / comma / blur. Backspace on an empty input drops the
 * last tag. Controlled — the consumer owns the tag array and supplies any
 * placeholder copy.
 */
export interface TagInputProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function TagInput({
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
}: TagInputProps) {
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
    <div className={cn('space-y-2', className)}>
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
                className="rounded-full text-muted-foreground hover:text-foreground"
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
