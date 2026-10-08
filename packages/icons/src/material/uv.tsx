import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** uv — Material Icon Theme (MIT). */
const UvIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#e040fb" d="M2 2v11c0 .5.5 1 1 1h8c.5 0 1-.5 1-1h1v1h1V2H8v8H7V2z" />
  </svg>
);

export { UvIcon };
