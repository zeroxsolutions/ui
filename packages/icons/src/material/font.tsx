import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** font — Material Icon Theme (MIT). */
const FontIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#f44336" d="M24 28h4L18 4h-4L4 28h4l8-19.422"/><path fill="#f44336" d="M8 20h16v4H8z"/></svg>
);

export { FontIcon };
