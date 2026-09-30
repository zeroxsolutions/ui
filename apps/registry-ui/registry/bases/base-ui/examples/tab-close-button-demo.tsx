import type { ReactNode } from 'react';

import { TabCloseButton } from '@/registry/bases/base-ui/components/feedback/tab-close-button';
import { Item, ItemActions, ItemContent, ItemTitle } from '@/registry/bases/base-ui/ui/item';

/** Two editor tabs: one saved, one with unsaved changes. */
function TabCloseButtonDemo(): ReactNode {
  return (
    <div className="flex items-center gap-2">
      <Item variant="outline" size="xs" className="group/tab w-fit">
        <ItemContent>
          <ItemTitle>index.ts</ItemTitle>
        </ItemContent>
        <ItemActions>
          <TabCloseButton />
        </ItemActions>
      </Item>
      <Item variant="outline" size="xs" className="group/tab w-fit">
        <ItemContent>
          <ItemTitle>page.tsx</ItemTitle>
        </ItemContent>
        <ItemActions>
          <TabCloseButton dirty />
        </ItemActions>
      </Item>
    </div>
  );
}

export { TabCloseButtonDemo };
