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
 * stands alone. Every `LucideProps` passes through. Every glyph is a static
 * `lucide-react` one, `FileText` included where an animated twin is vendored:
 * one icon set keeps the props this component takes the same for every type.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps): ReactNode {
  const Icon = fileTypeIcon(name);
  return <Icon data-slot="file-type-icon" {...props} />;
}

export { FileTypeIcon };
export type { FileTypeIconProps };
