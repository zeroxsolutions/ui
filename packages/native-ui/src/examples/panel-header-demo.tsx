import { PanelLeftClose } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { PanelHeader, PanelHeaderActions, PanelHeaderRow, PanelHeaderTitle } from '@/components/layout/panel-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

/** A single-row panel header: a title beside a trailing collapse action. */
function PanelHeaderDemo(): ReactNode {
  return (
    <PanelHeader className="bg-card w-full max-w-sm">
      <PanelHeaderRow>
        <PanelHeaderTitle>
          <Text className="text-sm">Properties</Text>
        </PanelHeaderTitle>
        <PanelHeaderActions>
          <Button variant="ghost" size="icon-sm" aria-label="Collapse panel">
            <Icon as={PanelLeftClose} />
          </Button>
        </PanelHeaderActions>
      </PanelHeaderRow>
    </PanelHeader>
  );
}

export { PanelHeaderDemo };
