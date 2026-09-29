import type { ReactNode } from 'react';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

/** A bordered card whose body collapses behind its own trigger. */
function CollapsibleCardDemo(): ReactNode {
  return (
    <CollapsibleCard className="w-full max-w-sm">
      <CollapsibleCardHeader>
        <CollapsibleCardTitle>Layers</CollapsibleCardTitle>
        <CollapsibleCardActions>
          <CollapsibleCardTrigger />
        </CollapsibleCardActions>
      </CollapsibleCardHeader>
      <CollapsibleCardContent className="px-3 pb-3">Background, Shadow, Text</CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CollapsibleCardDemo };
