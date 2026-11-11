import { Pencil } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  TreeItem,
  TreeItemIndent,
  TreeItemLabel,
  TreeItemRenameInput,
  TreeItemTrigger,
} from '@/components/data-display/tree-item';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** A folder over two files, opened and closed by its trigger, and a file renamed in place by its pencil. */
function TreeItemDemo(): ReactNode {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('README.md');
  const [draft, setDraft] = useState<string | null>(null);

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
      <TreeItem leaf editing={draft !== null}>
        <TreeItemIndent depth={0} />
        <TreeItemLabel>
          {draft === null ? (
            name
          ) : (
            <TreeItemRenameInput
              aria-label={`New name for ${name}`}
              value={draft}
              onChangeText={setDraft}
              onCommit={() => {
                if (draft.trim() !== '') setName(draft.trim());
                setDraft(null);
              }}
              onCancel={() => setDraft(null)}
            />
          )}
        </TreeItemLabel>
        {draft === null && (
          <Button variant="ghost" size="icon-xs" aria-label={`Rename ${name}`} onPress={() => setDraft(name)}>
            <Icon as={Pencil} />
          </Button>
        )}
      </TreeItem>
    </View>
  );
}

export { TreeItemDemo };
