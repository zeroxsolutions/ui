import { useState, type ComponentProps, type ReactNode } from 'react';
import { TextInput } from 'react-native';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that Vega slot's view classes and `cn-<slot>/text` for its text
// classes, and `@focused` and `@invalid` for the classes behind those states; the registry build
// replaces each with the classes translated for the target engine.

type InputProps = ComponentProps<typeof TextInput> & {
  /** Draws the destructive border and announces the field as invalid. */
  'aria-invalid'?: boolean;
};

/**
 * A single-line text field. It takes the focus border while it holds focus and the destructive
 * border while `aria-invalid`, and `editable={false}` dims it and announces it disabled. Name it with
 * a Label through `aria-labelledby`. NativeWind draws the placeholder through its `placeholder:` variant.
 */
function Input({ className, editable, onFocus, onBlur, 'aria-invalid': invalid, ...props }: InputProps): ReactNode {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;

  return (
    <TextInput
      className={cn(
        'cn-input cn-input/text text-foreground placeholder:text-muted-foreground',
        focused && 'cn-input@focused',
        invalid && 'cn-input@invalid',
        disabled && 'opacity-50',
        className,
      )}
      editable={editable}
      aria-invalid={invalid}
      aria-disabled={disabled || undefined}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
