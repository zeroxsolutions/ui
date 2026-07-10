import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** toml — Material Icon Theme (MIT). `.Light` = light-background variant. */
const TomlIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#cfd8dc" d="M4 6V4h8v2H9v7H7V6z"/><path fill="#ef5350" d="M4 1v1H2v12h2v1H1V1zm8 0v1h2v12h-2v1h3V1z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

TomlIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#455a64" d="M4 6V4h8v2H9v7H7V6z"/><path fill="#ef5350" d="M4 1v1H2v12h2v1H1V1zm8 0v1h2v12h-2v1h3V1z"/></svg>
);

export { TomlIcon };
