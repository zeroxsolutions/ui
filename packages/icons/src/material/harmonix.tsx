import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** harmonix — Material Icon Theme (MIT). */
const HarmonixIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#536dfe" d="M27 13 16 2 5 13l8 8-6 6 3 3 6-6 6 6 3-3-6-6zm-17 0 6-6 6 6-6 6z" />
  </svg>
);

export { HarmonixIcon };
