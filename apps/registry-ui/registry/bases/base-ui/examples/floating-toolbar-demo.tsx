import { Bold, Italic, Underline } from 'lucide-react';
import type { ReactNode } from 'react';

import { FloatingToolbar } from '@/registry/bases/base-ui/components/layout/floating-toolbar';
import { Button } from '@/registry/bases/base-ui/ui/button';

/** A row of formatting buttons in the toolbar's own shell. */
function FloatingToolbarDemo(): ReactNode {
  return (
    <FloatingToolbar aria-label="Text formatting">
      <Button variant="ghost" size="icon-sm" aria-label="Bold">
        <Bold />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Italic">
        <Italic />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Underline">
        <Underline />
      </Button>
    </FloatingToolbar>
  );
}

export { FloatingToolbarDemo };
