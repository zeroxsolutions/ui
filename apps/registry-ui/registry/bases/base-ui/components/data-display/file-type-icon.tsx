import type { LucideProps } from 'lucide-react';
import type { ReactNode } from 'react';

import { fileTypeIcon } from '@/registry/bases/base-ui/lib/file-type';

interface FileTypeIconProps extends LucideProps {
  /** File name or path; the icon is derived from its extension. */
  name: string;
}

/**
 * A lucide icon chosen for a file's type from its extension (`run.py` -> code,
 * `logo.png` -> image, `Inter.woff2` -> type, unknown -> a generic file).
 * Decorative: pair it with the visible file name, or pass `aria-label` when it
 * stands alone. Every `LucideProps` passes through.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps): ReactNode {
  const Icon = fileTypeIcon(name);
  return <Icon data-slot="file-type-icon" {...props} />;
}

export { FileTypeIcon };
export type { FileTypeIconProps };
