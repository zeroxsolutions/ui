import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** poetry — Material Icon Theme (MIT). */
const PoetryIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#3f51b5" d="M20.137 17.834A18.52 18.52 0 0 1 6 24l5 6a25.1 25.1 0 0 0 13-8Z"/><path fill="#1976d2" d="M6 2v22a18.52 18.52 0 0 0 14.137-6.166Z"/><path fill="#29b6f6" d="m6 2 14.137 15.834A23.7 23.7 0 0 0 26 2Z"/></svg>
);

export { PoetryIcon };
