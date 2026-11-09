import { Bold, Italic, Underline } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { FloatingToolbar } from '@/components/layout/floating-toolbar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** A row of formatting buttons in the toolbar's own shell. */
function FloatingToolbarDemo(): ReactNode {
  return (
    <FloatingToolbar aria-label="Text formatting" className="self-start">
      <Button variant="ghost" size="icon-sm" aria-label="Bold">
        <Icon as={Bold} />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Italic">
        <Icon as={Italic} />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Underline">
        <Icon as={Underline} />
      </Button>
    </FloatingToolbar>
  );
}

export { FloatingToolbarDemo };
