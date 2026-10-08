import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** siyuan — Material Icon Theme (MIT). */
const SiyuanIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#e53935" d="M2 11.976 10 4v16l-8 8Z" />
    <path fill="#455a64" d="M30 11.976 22 4v15.99L30 28ZM10 4l6 6v16l-6-6Z" />
    <path fill="#e53935" d="m22 4-6 6v16l6-6.01Z" />
  </svg>
);

export { SiyuanIcon };
