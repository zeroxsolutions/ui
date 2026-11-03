import type { ReactNode } from 'react';

import {
  EditorTab,
  EditorTabCloseButton,
  EditorTabTitle,
} from '@/registry/bases/base-ui/components/navigation/editor-tab';
import { ItemActions, ItemContent } from '@/registry/bases/base-ui/ui/item';

/** A tab strip: the active tab, and one with unsaved changes. */
function EditorTabDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}

export { EditorTabDemo };
