import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** slim — Material Icon Theme (MIT). */
const SlimIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path
      fill="#f57f17"
      d="M23 2H9a7 7 0 0 0-7 7v14a7 7 0 0 0 7 7h14a7 7 0 0 0 7-7V9a7 7 0 0 0-7-7m-5 14-4-6v6H6a10 10 0 0 1 20 0Z"
    />
  </svg>
);

export { SlimIcon };
