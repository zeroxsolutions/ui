import { useState, type ComponentProps, type ReactNode } from 'react';
import { TextInput } from 'react-native';
import { cn } from '../lib/utils';

// A `cn-<slot>` token stands for that Vega slot's view classes and `cn-<slot>/text` for its text
// classes, and `@focused` and `@invalid` for the classes behind those states; the registry build
// replaces each with the classes translated for the target engine.

type TextareaProps = ComponentProps<typeof TextInput> & {
  /** Draws the destructive border and announces the field as invalid. */
  'aria-invalid'?: boolean;
};

/**
 * A multiline text field 64px tall at least, which grows with its text. It takes the focus
 * border while it holds focus and the destructive border while `aria-invalid`, and
 * `editable={false}` dims it and announces it disabled. Uniwind draws the placeholder through `placeholderTextColorClassName`, which takes an `accent-` class.
 */
function Textarea({
  className,
  editable,
  onFocus,
  onBlur,
  'aria-invalid': invalid,
  ...props
}: TextareaProps): ReactNode {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;

  return (
    <TextInput
      multiline
      textAlignVertical="top"
      className={cn(
        'min-h-16 cn-textarea cn-textarea/text text-foreground',
        focused && 'cn-textarea@focused',
        invalid && 'cn-textarea@invalid',
        disabled && 'opacity-50',
        className,
      )}
      placeholderTextColorClassName="accent-muted-foreground"
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

export { Textarea };
export type { TextareaProps };
