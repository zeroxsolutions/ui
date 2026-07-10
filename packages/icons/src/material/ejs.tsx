import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** ejs — Material Icon Theme (MIT). */
const EjsIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size} {...props}><path fill="#ffca28" d="M8.046 4.862.908 12l7.138 7.138 2.71-2.691L6.308 12l4.446-4.447z"/><ellipse cx="14.543" cy="7.812" stroke="#ffca28" strokeWidth="1.455" rx="2.101" ry="2.798"/><path fill="#ffca28" d="m20.616 4.152 1.47.69-7.783 15.005-1.47-.69z"/><ellipse cx="20.35" cy="16.198" stroke="#ffca28" strokeWidth="1.455" rx="2.101" ry="2.798"/></svg>
);

export { EjsIcon };
