import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { EditorTab, EditorTabCloseButton, EditorTabTitle } from '@/components/navigation/editor-tab';
import { ItemActions, ItemContent } from '@/components/ui/item';

const DIRTY = new Set(['page.tsx']);

/** A tab strip: pressing a tab shows its document, its X closes it, and page.tsx has unsaved changes. */
function EditorTabDemo(): ReactNode {
  const [open, setOpen] = useState(['index.ts', 'page.tsx']);
  const [active, setActive] = useState<string | undefined>('index.ts');

  const close = (file: string): void => {
    const rest = open.filter((name) => name !== file);
    setOpen(rest);
    if (file === active) setActive(rest[0]);
  };

  return (
    <View role="tablist" className="flex-row items-center gap-2">
      {open.map((file) => (
        <EditorTab key={file} active={file === active} dirty={DIRTY.has(file)} asChild>
          <Pressable role="tab" aria-label={file} aria-selected={file === active} onPress={() => setActive(file)}>
            <ItemContent>
              <EditorTabTitle>{file}</EditorTabTitle>
            </ItemContent>
            <ItemActions>
              <EditorTabCloseButton aria-label={`Close ${file}`} onPress={() => close(file)} />
            </ItemActions>
          </Pressable>
        </EditorTab>
      ))}
    </View>
  );
}

export { EditorTabDemo };
