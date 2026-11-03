import type { ReactNode } from 'react';

import {
  CollapsibleCard,
  CollapsibleCardActions,
  CollapsibleCardContent,
  CollapsibleCardHeader,
  CollapsibleCardTitle,
  CollapsibleCardTrigger,
} from '@/registry/bases/base-ui/components/layout/collapsible-card';

const VARIANTS = ['default', 'muted', 'plain', 'flush'] as const;

/** The card's four surfaces stacked: default, muted, plain and flush. */
function CollapsibleCardVariantsDemo(): ReactNode {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {VARIANTS.map((variant) => (
        <CollapsibleCard key={variant} variant={variant}>
          <CollapsibleCardHeader>
            <CollapsibleCardTitle>{variant}</CollapsibleCardTitle>
            <CollapsibleCardActions>
              <CollapsibleCardTrigger />
            </CollapsibleCardActions>
          </CollapsibleCardHeader>
          <CollapsibleCardContent className="p-3">Background, shadow, text</CollapsibleCardContent>
        </CollapsibleCard>
      ))}
    </div>
  );
}

export { CollapsibleCardVariantsDemo };
