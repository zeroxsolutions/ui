import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** markdoc — Material Icon Theme (MIT). */
const MarkdocIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#78909c" d="m14 10-4 3.5L6 10H4v12h4v-6l2 2 2-2v6h4V10Z" />
    <rect width="6" height="16" x="22" y="8" fill="#ffb300" rx=".5" />
  </svg>
);

export { MarkdocIcon };
