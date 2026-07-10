import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** vitest — Material Icon Theme (MIT). */
const VitestIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#00e676" d="M15.438 29.636a.685.685 0 0 1-1.029.213L2.274 20.755A.65.65 0 0 1 2 20.187V9.175a.715.715 0 0 1 1.166-.568l7.404 5.612a1.47 1.47 0 0 0 2.125-.497l6.102-11.367A.72.72 0 0 1 19.414 2h9.872a.76.76 0 0 1 .617 1.137l-14.465 26.57Z"/></svg>
);

export { VitestIcon };
