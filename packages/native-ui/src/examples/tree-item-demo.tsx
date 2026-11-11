import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { TreeItem, TreeItemIndent, TreeItemLabel, TreeItemTrigger } from '@/components/data-display/tree-item';

/** A folder over two files, opened and closed by its trigger. */
function TreeItemDemo(): ReactNode {
  const [open, setOpen] = useState(true);

  return (
    <View className="w-full flex-col gap-1">
      <TreeItem expanded={open}>
        <TreeItemIndent depth={0}>
          <TreeItemTrigger aria-label="Toggle src" onPress={() => setOpen((current) => !current)} />
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
    </View>
  );
}

export { TreeItemDemo };
