import type { ReactNode } from 'react';

import {
  FileTree,
  FileTreeGroup,
  FileTreeItem,
  FileTreeLabel,
} from '@/registry/bases/base-ui/components/layout/file-tree';

/** A small file tree with one folder expanded and a leaf selected by default. */
function FileTreeDemo(): ReactNode {
  return (
    <FileTree aria-label="Files" defaultExpanded={['src']} defaultValue="src/index.ts" className="w-full max-w-xs">
      <FileTreeItem value="src">
        <FileTreeLabel>src</FileTreeLabel>
        <FileTreeGroup>
          <FileTreeItem value="src/index.ts">
            <FileTreeLabel>index.ts</FileTreeLabel>
          </FileTreeItem>
          <FileTreeItem value="src/util.ts">
            <FileTreeLabel>util.ts</FileTreeLabel>
          </FileTreeItem>
        </FileTreeGroup>
      </FileTreeItem>
      <FileTreeItem value="README.md">
        <FileTreeLabel>README.md</FileTreeLabel>
      </FileTreeItem>
    </FileTree>
  );
}

export { FileTreeDemo };
