import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** cursor — Material Icon Theme (MIT). `.Light` = light-background variant. */
const CursorIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#e0e0e0" fillRule="evenodd" d="m16 30 12-20v14zM4 10l12-8 12 8zm0 0 12 6v14L4 24z" />
  </svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

CursorIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#424242" fillRule="evenodd" d="m16 30 12-20v14zM4 10l12-8 12 8zm0 0 12 6v14L4 24z" />
  </svg>
);

export { CursorIcon };
