'use client';

import type { ReactNode } from 'react';

import { TreeItem, TreeItemIndent, TreeItemLabel } from '@/registry/bases/base-ui/components/data-entry/tree-item';
import { ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** A folder expanded over two files. */
function TreeItemDemo(): ReactNode {
  return (
    <div className="flex w-full flex-col gap-1">
      <TreeItem expanded>
        <TreeItemIndent depth={0} hasChildren onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>src</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>index.ts</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
      <TreeItem>
        <TreeItemIndent depth={1} hasChildren={false} onToggleExpand={() => {}} />
        <TreeItemLabel>
          <ItemTitle>page.tsx</ItemTitle>
        </TreeItemLabel>
      </TreeItem>
    </div>
  );
}

export { TreeItemDemo };
