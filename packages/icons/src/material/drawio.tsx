import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** drawio — Material Icon Theme (MIT). */
const DrawioIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path
      fill="#fb8c00"
      d="m25.329 20-7.001-8H20V4h-8v8h1.672l-7.001 8H4v8h8v-8H9.328L16 12.376 22.672 20H20v8h8v-8z"
    />
  </svg>
);

export { DrawioIcon };
