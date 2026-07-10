import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** zeabur — Material Icon Theme (MIT). `.Light` = light-background variant. */
const ZeaburIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#cfd8dc" d="m14 20 4 4-4 4H2v-8h8l10-8-6-4 6-4h10v8Z"/><path fill="#651fff" d="M20 4H2v8h18Z"/><path fill="#ff3d00" d="M30 20H14v8h16Z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

ZeaburIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#263238" d="m14 20 4 4-4 4H2v-8h8l10-8-6-4 6-4h10v8Z"/><path fill="#651fff" d="M20 4H2v8h18Z"/><path fill="#ff3d00" d="M30 20H14v8h16Z"/></svg>
);

export { ZeaburIcon };
