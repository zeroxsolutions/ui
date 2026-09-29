import type { ReactNode } from 'react';

import {
  CollapsibleCard,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';
import { Badge } from '@/registry/bases/base-ui/ui/badge';

/**
 * A titled, collapsible group of rows in a panel: `CollapsibleCard`'s `plain`
 * variant, its row count carried by a Badge instead of a baked-in `count` prop.
 */
function CollapsibleCardSection(): ReactNode {
  return (
    <CollapsibleCard variant="plain">
      <CollapsibleCardHeader>
        <CollapsibleCardTrigger />
        <CollapsibleCardTitle>
          Environment variables
          <Badge variant="secondary">3</Badge>
        </CollapsibleCardTitle>
      </CollapsibleCardHeader>
      <CollapsibleCardContent>
        <div className="flex flex-col gap-2 px-2.5 pb-2.5 text-sm">
          <div>API_URL</div>
          <div>NODE_ENV</div>
          <div>LOG_LEVEL</div>
        </div>
      </CollapsibleCardContent>
    </CollapsibleCard>
  );
}

export { CollapsibleCardSection };
