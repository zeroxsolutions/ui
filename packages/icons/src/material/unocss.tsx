import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** unocss — Material Icon Theme (MIT). */
const UnocssIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <circle cx="24" cy="24" r="6" fill="#78909c" />
    <path fill="#546e7a" d="M2 18v6a6 6 0 0 0 12 0v-6Z" />
    <path fill="#b0bec5" d="M30 14V8a6 6 0 0 0-12 0v6Z" />
  </svg>
);

export { UnocssIcon };
