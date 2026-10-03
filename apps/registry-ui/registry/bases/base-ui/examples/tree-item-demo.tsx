'use client';

import { useState, type ReactNode } from 'react';

import {
  TreeItem,
  TreeItemIndent,
  TreeItemLabel,
  TreeItemTrigger,
} from '@/registry/bases/base-ui/components/data-display/tree-item';

/** A folder over two files, opened and closed by its trigger. */
function TreeItemDemo(): ReactNode {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex w-full flex-col gap-1">
      <TreeItem expanded={open}>
        <TreeItemIndent depth={0}>
          <TreeItemTrigger aria-label="Toggle src" onClick={() => setOpen((current) => !current)} />
        </TreeItemIndent>
        <TreeItemLabel>src</TreeItemLabel>
      </TreeItem>
      {open && (
        <>
          <TreeItem leaf>
            <TreeItemIndent depth={1} />
            <TreeItemLabel>index.ts</TreeItemLabel>
          </TreeItem>
          <TreeItem leaf>
            <TreeItemIndent depth={1} />
            <TreeItemLabel>page.tsx</TreeItemLabel>
          </TreeItem>
        </>
      )}
      <TreeItem leaf>
        <TreeItemIndent depth={0} />
        <TreeItemLabel>README.md</TreeItemLabel>
      </TreeItem>
    </div>
  );
}

export { TreeItemDemo };
