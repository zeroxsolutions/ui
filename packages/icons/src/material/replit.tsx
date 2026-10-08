import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** replit — Material Icon Theme (MIT). */
const ReplitIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path
      fill="#ff6d00"
      d="M8 4h8v8H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 8h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-8zm-8 8h8v8H8a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2"
    />
  </svg>
);

export { ReplitIcon };
