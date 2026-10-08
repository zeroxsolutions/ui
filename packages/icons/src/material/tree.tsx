import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** tree — Material Icon Theme (MIT). */
const TreeIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#7cb342" d="M4 4h10v6H4zm16 10h10v6H20zm0 8h10v6H20zm-4-4v-2h-6v-4H8v14h8v-2h-6v-6z" />
  </svg>
);

export { TreeIcon };
