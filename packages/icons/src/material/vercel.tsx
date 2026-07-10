import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** vercel — Material Icon Theme (MIT). `.Light` = light-background variant. */
const VercelIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#cfd8dc" d="m16 6 12 20H4Z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

VercelIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#455a64" d="m16 6 12 20H4Z"/></svg>
);

export { VercelIcon };
