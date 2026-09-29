import { FileIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/registry/bases/base-ui/ui/empty';

/** A fallback for a file with no inline viewer: an icon and its name, composed from upstream parts. */
function EmptyFile(): ReactNode {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileIcon />
        </EmptyMedia>
        <EmptyTitle>invoice.pdf</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export { EmptyFile };
