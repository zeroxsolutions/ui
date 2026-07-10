import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** favicon — Material Icon Theme (MIT). */
const FaviconIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#ffd54f" d="m16 24 10 6-4-10 8-8-10-.032L16 2l-4 10H2l8 8-4 10Z"/></svg>
);

export { FaviconIcon };
