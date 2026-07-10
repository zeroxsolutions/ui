import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** hosts — Material Icon Theme (MIT). `.Light` = light-background variant. */
const HostsIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#cfd8dc" d="m14 6-3-3v2H7v2h4v2M5 7l-3 3 3 3v-2h4V9H5z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

HostsIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#455a64" d="m14 6-3-3v2H7v2h4v2M5 7l-3 3 3 3v-2h4V9H5z"/></svg>
);

export { HostsIcon };
