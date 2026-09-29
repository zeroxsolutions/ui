import type { LucideProps } from 'lucide-react';

import { fileTypeIcon } from '@/registry/bases/base-ui/lib/file-type';

interface FileTypeIconProps extends LucideProps {
  /** File name or path; the icon is derived from its extension. */
  name: string;
}

/**
 * A lucide icon chosen for a file's type, derived from its extension
 * (`run.py` → code, `logo.png` → image, `Inter.woff2` → type, unknown → generic
 * file). Decorative — pair it with the visible file name, which supplies the
 * accessible label, or pass `aria-label` when it stands alone. All `LucideProps`
 * (`size`, `className`, `aria-*`) pass through.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps) {
  const Icon = fileTypeIcon(name);
  return <Icon {...props} />;
}

export { FileTypeIcon };
export type { FileTypeIconProps };
