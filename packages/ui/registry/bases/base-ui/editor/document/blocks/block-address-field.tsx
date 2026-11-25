import { useId, type ReactNode } from 'react';
import { Input } from '@/registry/bases/base-ui/ui/input';
import { cn } from '@/registry/bases/base-ui/lib/utils';

export interface BlockAddressFieldProps {
  /** The field's name, read by assistive tech; the placeholder shows it to the eye. */
  label: string;
  placeholder: string;
  className?: string;
  /** Called with the trimmed address on Enter and when the field loses the focus; never with an empty one. */
  onCommit(address: string): void;
}

/**
 * The field an empty block takes its address in, in place of what it draws once it has one. It sits outside the
 * editable text, so typing in it never reaches the document.
 */
export function BlockAddressField({ label, placeholder, className, onCommit }: BlockAddressFieldProps): ReactNode {
  const id = useId();
  const commit = (value: string): void => {
    const address = value.trim();
    if (address !== '') onCommit(address);
  };
  return (
    <div data-slot="block-address-field" contentEditable={false} className={cn('not-prose my-2', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        type="url"
        placeholder={placeholder}
        onBlur={(event) => commit(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
      />
    </div>
  );
}
