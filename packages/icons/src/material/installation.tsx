import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** installation — Material Icon Theme (MIT). */
const InstallationIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#ff5722" d="M12 7h-2V2H6v5H4l4 4zm-9 5.5V14h10v-1.5z" />
  </svg>
);

export { InstallationIcon };
