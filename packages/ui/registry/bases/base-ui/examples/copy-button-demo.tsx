'use client';

import { useState, type ReactNode } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';
import { Item, ItemActions, ItemContent } from '@/registry/bases/base-ui/ui/item';

/** An install command with its own copy button, announcing the copy inline. */
function CopyButtonDemo(): ReactNode {
  const [copied, setCopied] = useState(false);

  return (
    <Item variant="outline" size="sm" className="w-full max-w-sm">
      <ItemContent>
        <code className="font-mono">pnpm add @zeroxsolutions/icons</code>
      </ItemContent>
      <ItemActions>
        {copied && <span className="text-muted-foreground text-xs">Copied</span>}
        <CopyButton value="pnpm add @zeroxsolutions/icons" onCopied={() => setCopied(true)} />
      </ItemActions>
    </Item>
  );
}

export { CopyButtonDemo };
