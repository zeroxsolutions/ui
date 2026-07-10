import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** verse — Material Icon Theme (MIT). `.Light` = light-background variant. */
const VerseIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#cfd8dc" d="m1 1 7 14 7-14H9l3 2c-1.164 2.334-2.34 4.664-3.5 7-1.507-2.997-3-6-4.5-9z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

VerseIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#546e7a" d="m1 1 7 14 7-14H9l3 2c-1.164 2.334-2.34 4.664-3.5 7-1.507-2.997-3-6-4.5-9z"/></svg>
);

export { VerseIcon };
