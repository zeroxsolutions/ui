'use client';

import { useRef, type ReactNode } from 'react';

import { FloatingToolbar } from '@/registry/bases/base-ui/components/layout/floating-toolbar';
import { LetterBIcon, type LetterBIconHandle } from '@/registry/bases/base-ui/icons/lucide/letter-b-icon';
import { Button } from '@/registry/bases/base-ui/ui/button';
import { ItalicIcon, type ItalicIconHandle } from '@/registry/bases/base-ui/icons/lucide/italic-icon';
import { UnderlineIcon, type UnderlineIconHandle } from '@/registry/bases/base-ui/icons/lucide/underline-icon';

/** A row of formatting buttons in the toolbar's own shell, each icon playing while its button is hovered or focused. */
function FloatingToolbarDemo(): ReactNode {
  const boldRef = useRef<LetterBIconHandle>(null);
  const italicRef = useRef<ItalicIconHandle>(null);
  const underlineRef = useRef<UnderlineIconHandle>(null);

  return (
    <FloatingToolbar aria-label="Text formatting">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Bold"
        onMouseEnter={() => boldRef.current?.startAnimation()}
        onMouseLeave={() => boldRef.current?.stopAnimation()}
        onFocus={() => boldRef.current?.startAnimation()}
        onBlur={() => boldRef.current?.stopAnimation()}
      >
        <LetterBIcon ref={boldRef} aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Italic"
        onMouseEnter={() => italicRef.current?.startAnimation()}
        onMouseLeave={() => italicRef.current?.stopAnimation()}
        onFocus={() => italicRef.current?.startAnimation()}
        onBlur={() => italicRef.current?.stopAnimation()}
      >
        <ItalicIcon ref={italicRef} aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Underline"
        onMouseEnter={() => underlineRef.current?.startAnimation()}
        onMouseLeave={() => underlineRef.current?.stopAnimation()}
        onFocus={() => underlineRef.current?.startAnimation()}
        onBlur={() => underlineRef.current?.stopAnimation()}
      >
        <UnderlineIcon ref={underlineRef} aria-hidden />
      </Button>
    </FloatingToolbar>
  );
}

export { FloatingToolbarDemo };
