import type { ReactNode } from 'react';
import { View } from 'react-native';

import { EditorTab, EditorTabCloseButton, EditorTabTitle } from '@/components/navigation/editor-tab';
import { ItemActions, ItemContent } from '@/components/ui/item';

/** A tab strip: the active tab, and one with unsaved changes. */
function EditorTabDemo(): ReactNode {
  return (
    <View className="flex-row items-center gap-2">
      <EditorTab active>
        <ItemContent>
          <EditorTabTitle>index.ts</EditorTabTitle>
        </ItemContent>
        <ItemActions>
          <EditorTabCloseButton aria-label="Close index.ts" />
        </ItemActions>
      </EditorTab>
      <EditorTab dirty>
        <ItemContent>
          <EditorTabTitle>page.tsx</EditorTabTitle>
        </ItemContent>
        <ItemActions>
          <EditorTabCloseButton aria-label="Close page.tsx" />
        </ItemActions>
      </EditorTab>
    </View>
  );
}

export { EditorTabDemo };
