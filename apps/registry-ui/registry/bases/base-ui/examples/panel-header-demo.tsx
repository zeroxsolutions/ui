import { PanelLeftClose } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderRow,
  PanelHeaderTitle,
} from '@/registry/bases/base-ui/components/layout/panel-header';
import { Button } from '@/registry/bases/base-ui/ui/button';

/** A single-row panel header: a title beside a trailing collapse action. */
function PanelHeaderDemo(): ReactNode {
  return (
    <PanelHeader className="bg-card w-full max-w-sm">
      <PanelHeaderRow>
        <PanelHeaderTitle>Properties</PanelHeaderTitle>
        <PanelHeaderActions>
          <Button variant="ghost" size="icon-sm" aria-label="Collapse panel">
            <PanelLeftClose />
          </Button>
        </PanelHeaderActions>
      </PanelHeaderRow>
    </PanelHeader>
  );
}

export { PanelHeaderDemo };
