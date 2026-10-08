import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** slint — Material Icon Theme (MIT). */
const SlintIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#2979ff" d="M12 1 3 7l5 2-2-2Z" />
    <path fill="#2979ff" d="m4 15 9-6-5-2 2 2Z" />
  </svg>
);

export { SlintIcon };
