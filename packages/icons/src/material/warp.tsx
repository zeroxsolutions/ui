import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** warp — Material Icon Theme (MIT). `.Light` = light-background variant. */
const WarpIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <g fill="#cfd8dc">
      <path d="M8.443 2h5.064C14.362 2 15 2.716 15 3.6v6.8c0 .884-.718 1.6-1.573 1.6H6.224z" />
      <path d="M7 4H2.533C1.686 4 1 4.715 1 5.599v6.802C1 13.284 1.717 14 2.563 14H7.79L8 13H5z" />
    </g>
  </svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

WarpIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <g fill="#546e7a">
      <path d="M8.443 2h5.064C14.362 2 15 2.716 15 3.6v6.8c0 .884-.718 1.6-1.573 1.6H6.224z" />
      <path d="M7 4H2.533C1.686 4 1 4.715 1 5.599v6.802C1 13.284 1.717 14 2.563 14H7.79L8 13H5z" />
    </g>
  </svg>
);

export { WarpIcon };
