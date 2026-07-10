import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** wepy — Material Icon Theme (MIT). */
const WepyIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#4caf50" d="M16 2A14 14 0 0 0 2 16v12a2 2 0 0 0 2 2h12a14 14 0 0 0 0-28m0 24a10 10 0 1 1 10-10 10.01 10.01 0 0 1-10 10"/></svg>
);

export { WepyIcon };
