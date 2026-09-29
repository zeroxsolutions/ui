'use client';

import { useState, type ReactNode } from 'react';

import { CopyButton } from '@/registry/bases/base-ui/components/feedback/copy-button';

/** An install command with its own copy button, announcing the copy inline. */
function CopyButtonDemo(): ReactNode {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-md border px-3 py-2">
      <code className="font-mono text-sm">pnpm add @zeroxsolutions/icons</code>
      <div className="flex items-center gap-2">
        {copied && <span className="text-muted-foreground text-xs">Copied</span>}
        <CopyButton value="pnpm add @zeroxsolutions/icons" onCopied={() => setCopied(true)} />
      </div>
    </div>
  );
}

export { CopyButtonDemo };
