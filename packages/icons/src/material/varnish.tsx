import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** varnish — Material Icon Theme (MIT). */
const VarnishIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <g fill="#0288d1" strokeWidth="0">
      <circle cx="2.5" cy="6.5" r="1.5" />
      <circle cx="11" cy="5" r="4" />
      <circle cx="6.5" cy="12.5" r="2.5" />
    </g>
  </svg>
);

export { VarnishIcon };
