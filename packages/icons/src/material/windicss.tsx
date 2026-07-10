import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** windicss — Material Icon Theme (MIT). */
const WindicssIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width={size} height={size} {...props}><path stroke="#42a5f5" strokeMiterlimit="3.339" strokeWidth="4" d="M22 12a4 4 0 1 1 4 4H2m14 10a4 4 0 1 0 4-4H10M8 6a4 4 0 1 1 4 4H2"/><path fill="#42a5f5" d="M2 20h4v4H2z"/></svg>
);

export { WindicssIcon };
