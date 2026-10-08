import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** pawn — Material Icon Theme (MIT). */
const PawnIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#ef6c00" d="M6 28h20v2H6zm8-18h4l4 14H10z" />
    <path fill="#ef6c00" d="M10 12h12v2H10z" />
    <circle cx="16" cy="7" r="4" fill="#ef6c00" />
  </svg>
);

export { PawnIcon };
