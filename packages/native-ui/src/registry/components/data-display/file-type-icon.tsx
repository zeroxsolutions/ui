import type { ReactNode } from 'react';
import { fileTypeIcon } from '../../lib/file-type';
import { Icon, type IconProps } from '../../ui/icon';

type FileTypeIconProps = Omit<IconProps, 'as'> & {
  /** File name or path; the icon is derived from its extension. */
  name: string;
};

/**
 * A lucide icon chosen for a file's type from its extension (`run.py` -> code, `logo.png` -> image,
 * `Inter.woff2` -> type, unknown -> a generic file), drawn through Icon, so its classes size and colour it.
 * Decorative and hidden from a screen reader: pair it with the visible file name, or pass `aria-label` when
 * it stands alone, which makes it an image of that name. Every Icon prop but `as` passes through.
 */
function FileTypeIcon({ name, ...props }: FileTypeIconProps): ReactNode {
  const named = props['aria-label'] !== undefined || props.accessibilityLabel !== undefined;
  return (
    <Icon as={fileTypeIcon(name)} accessible={named} role={named ? 'img' : undefined} aria-hidden={!named} {...props} />
  );
}

export { FileTypeIcon };
export type { FileTypeIconProps };
