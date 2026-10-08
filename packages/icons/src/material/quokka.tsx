import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** quokka — Material Icon Theme (MIT). */
const QuokkaIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}>
    <path fill="#ff6d00" d="M8 2v6H2v6h12V2z" paintOrder="fill markers stroke" />
  </svg>
);

export { QuokkaIcon };
