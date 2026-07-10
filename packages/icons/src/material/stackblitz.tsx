import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** stackblitz — Material Icon Theme (MIT). */
const StackblitzIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#2196f3" d="m5 15 8-8H9l2-6-8 8h4z"/></svg>
);

export { StackblitzIcon };
