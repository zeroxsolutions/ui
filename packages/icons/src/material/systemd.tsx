import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** systemd — Material Icon Theme (MIT). `.Light` = light-background variant. */
const SystemdIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#00e676" d="m9 8 3-2v4z"/><circle cx="6" cy="8" r="2" fill="#00e676"/><path fill="#eceff1" d="M3 5H1v6h2v-1H2V6h1zm10 0h2v6h-2v-1h1V6h-1z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

SystemdIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#00c853" d="m9 8 3-2v4z"/><circle cx="6" cy="8" r="2" fill="#00c853"/><path fill="#455a64" d="M3 5H1v6h2v-1H2V6h1zm10 0h2v6h-2v-1h1V6h-1z"/></svg>
);

export { SystemdIcon };
