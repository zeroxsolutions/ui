'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from 'react';

import { cn } from '@/registry/bases/base-ui/lib/utils';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { CheckIcon, type CheckIconHandle } from '@/registry/bases/base-ui/ui/check';
import { CopyIcon, type CopyIconHandle } from '@/registry/bases/base-ui/ui/copy';

/** How long a button shows its check after a copy, as upstream's. */
const COPIED_MS = 2000;

/** Copies with a hidden textarea, for a browser without the async clipboard or one that refuses it. */
function legacyCopyToClipboard(value: string): boolean {
  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  let hasCopied = false;
  try {
    hasCopied = document.execCommand('copy');
  } catch {
    hasCopied = false;
  }

  document.body.removeChild(textArea);
  return hasCopied;
}

/** Writes `value` to the clipboard; whether it landed. */
async function copyToClipboard(value: string): Promise<boolean> {
  if (typeof window === 'undefined' || !value) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return legacyCopyToClipboard(value);
    }
  }
  return legacyCopyToClipboard(value);
}

/**
 * Whether a copy just landed, true for two seconds after `markCopied`, and the check icon's handle,
 * which draws itself in as it appears.
 */
function useCopiedState(): {
  hasCopied: boolean;
  markCopied: () => void;
  checkIconRef: RefObject<CheckIconHandle | null>;
} {
  const [hasCopied, setHasCopied] = useState(false);
  const checkIconRef = useRef<CheckIconHandle>(null);

  useEffect(() => {
    if (!hasCopied) return;
    checkIconRef.current?.startAnimation();
    const timer = setTimeout(() => setHasCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  return { hasCopied, markCopied: () => setHasCopied(true), checkIconRef };
}

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, 'value'> {
  /** The text a click writes to the clipboard. */
  value: string;
}

/**
 * The copy button over a code block, upstream's: its copy icon plays on the button's hover or focus,
 * and after a copy a check draws in for two seconds.
 */
function CopyButton({ value, className, variant = 'ghost', ...props }: CopyButtonProps): ReactNode {
  const { hasCopied, markCopied, checkIconRef } = useCopiedState();
  const copyIconRef = useRef<CopyIconHandle>(null);

  return (
    <Button
      data-slot="copy-button"
      data-copied={hasCopied}
      size="icon"
      variant={variant}
      className={cn(
        'bg-code absolute top-3 right-2 z-10 size-7 hover:opacity-100 focus-visible:opacity-100',
        className,
      )}
      onClick={async () => {
        if (await copyToClipboard(value)) markCopied();
      }}
      onMouseEnter={() => copyIconRef.current?.startAnimation()}
      onMouseLeave={() => copyIconRef.current?.stopAnimation()}
      onFocus={() => copyIconRef.current?.startAnimation()}
      onBlur={() => copyIconRef.current?.stopAnimation()}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <CheckIcon ref={checkIconRef} /> : <CopyIcon ref={copyIconRef} />}
    </Button>
  );
}

export { copyToClipboard, CopyButton, useCopiedState };
