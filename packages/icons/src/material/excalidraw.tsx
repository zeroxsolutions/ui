import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** excalidraw — Material Icon Theme (MIT). */
const ExcalidrawIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#5c6bc0" d="m15 1-5 1-9 10 3 3 10-9zm-4 3h1v1h-1zm1 5-3 3 4 3 2-2zM7 4 4 7 2 5 1 1l4 1z" />
  </svg>
);

export { ExcalidrawIcon };
