import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** deepsource — Material Icon Theme (MIT). */
const DeepsourceIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#1de9b6" d="M2 2h9a1 1 0 0 1 1 .992A1 1 0 0 1 11 4H2z"/><path fill="#f44336" d="M2 12h11a1 1 0 0 1 1 1 1 1 0 0 1-1 1H2z"/><path fill="#ffb300" d="M2 9h7a1 1 0 0 0 1-1 1 1 0 0 0-1-1H2z"/></svg>
);

export { DeepsourceIcon };
