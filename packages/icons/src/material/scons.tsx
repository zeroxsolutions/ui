import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** scons — Material Icon Theme (MIT). `.Light` = light-background variant. */
const SconsIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#c62828" d="M1 12h6v3H1Zm8 0h6v3H9ZM1 8h3v3H1Zm11 0h3v3h-3ZM5 1h6v3H5Z"/><path fill="#b0bec5" d="M8 11 6 8h1V5h2v3h1Z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

SconsIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#c62828" d="M1 12h6v3H1Zm8 0h6v3H9ZM1 8h3v3H1Zm11 0h3v3h-3ZM5 1h6v3H5Z"/><path fill="#455a64" d="M8 11 6 8h1V5h2v3h1Z"/></svg>
);

export { SconsIcon };
