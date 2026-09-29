import type { ReactNode } from 'react';

import { FileTypeIcon } from '@/registry/bases/base-ui/components/data-display/file-type-icon';

const FILES = ['run.py', 'logo.png', 'Inter.woff2', 'notes.md', 'archive.zip'];

/** A row of file names, each with the icon FileTypeIcon resolves for its extension. */
function FileTypeIconDemo(): ReactNode {
  return (
    <ul className="flex flex-col gap-2">
      {FILES.map((name) => (
        <li key={name} className="flex items-center gap-2 text-sm">
          <FileTypeIcon name={name} className="text-muted-foreground size-4" />
          {name}
        </li>
      ))}
    </ul>
  );
}

export { FileTypeIconDemo };
