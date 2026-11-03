'use client';

import * as React from 'react';

import { Button } from '@/registry/bases/base-ui/ui/button';
import { CheckIcon } from '@/registry/bases/base-ui/icons/check-icon';
import { CopyIcon, type CopyIconHandle } from '@/registry/bases/base-ui/icons/copy-icon';

const COPY_RESET_MS = 2000;

interface CopyButtonProps extends Omit<React.ComponentProps<typeof Button>, 'value' | 'children'> {
  /** Text written to the clipboard on click. */
  value: string;
  /** Accessible name in the idle state. */
  label?: string;
  /** Accessible name shown briefly after a successful copy. */
  copiedLabel?: string;
  /** How long the copied state persists, in ms. */
  timeout?: number;
  /** Called with the value after a successful copy. */
  onCopied?: (value: string) => void;
}

/**
 * A copy-to-clipboard icon button. After a successful copy it shows a check,
 * takes `copiedLabel` as its accessible name and carries `data-copied` for
 * `timeout` ms, then resets. The check eases in, and reduced motion shows it
 * at once. A caller `onClick` runs first, and calling
 * `event.preventDefault()` in it skips the copy. Defaults to a `ghost`
 * `icon-xs` `Button`, and every `Button` prop passes through. A write the
 * browser refuses, such as a denied clipboard permission, leaves the button
 * idle. Its icon plays while the button is hovered or focused; a caller's
 * pointer and focus handlers still run.
 */
function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  timeout = COPY_RESET_MS,
  onCopied,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  variant = 'ghost',
  size = 'icon-xs',
  ...props
}: CopyButtonProps): React.ReactNode {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // The copy and the check icons expose the same handle; whichever is showing holds the ref.
  const iconRef = React.useRef<CopyIconHandle>(null);

  React.useEffect(() => (): void => clearTimeout(timer.current), []);

  const copy = React.useCallback(() => {
    if (!navigator?.clipboard?.writeText) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
        onCopied?.(value);
      })
      .catch(() => {
        // A refused write leaves the button uncopied, which is all the caller sees of it.
      });
  }, [value, timeout, onCopied]);

  return (
    <Button
      data-slot="copy-button"
      data-copied={copied ? '' : undefined}
      type="button"
      variant={variant}
      size={size}
      aria-label={copied ? copiedLabel : label}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) copy();
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
      {copied ? (
        <CheckIcon
          ref={iconRef}
          aria-hidden
          className="animate-in fade-in-0 zoom-in-50 duration-200 ease-out motion-reduce:animate-none"
        />
      ) : (
        <CopyIcon ref={iconRef} aria-hidden />
      )}
    </Button>
  );
}

export { CopyButton };
export type { CopyButtonProps };
