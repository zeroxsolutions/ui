import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** salt — Material Icon Theme (MIT). */
const SaltIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#03a9f4" d="M1 8v6h7l3-6h4V2H8L5 8z" />
  </svg>
);

export { SaltIcon };
