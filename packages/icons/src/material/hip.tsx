import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** hip — Material Icon Theme (MIT). */
const HipIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#f44336" d="M5 5 1 1h14v14l-4-4V5zm0 1-4 4v5h5l4-4H5z" />
  </svg>
);

export { HipIcon };
