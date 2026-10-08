import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** teal — Material Icon Theme (MIT). */
const TealIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#00acc1" d="M16 2a14 14 0 1 0 14 14A14 14 0 0 0 16 2m8 14h-8V8h8Z" />
  </svg>
);

export { TealIcon };
