import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** taskfile — Material Icon Theme (MIT). */
const TaskfileIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#4db6ac" d="M4 9v14l12 6V15z" />
    <path fill="#b2dfdb" d="M16 3 4 9l12 6 12-6z" />
    <path fill="#80cbc4" d="M16 15v14l12-6V9z" />
  </svg>
);

export { TaskfileIcon };
