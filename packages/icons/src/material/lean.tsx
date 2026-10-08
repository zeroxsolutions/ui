import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** lean — Material Icon Theme (MIT). */
const LeanIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 4.5 4.5" width={size} height={size} {...props}>
    <path
      fill="#448aff"
      d="m-1.353-1.719-.366.188 1.97 3.75 1.968-3.75-.366-.188-.871 1.66H-.482zM-.313.25H.813L.25 1.375z"
      color="#000"
    />
  </svg>
);

export { LeanIcon };
