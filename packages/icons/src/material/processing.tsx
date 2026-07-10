import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** processing — Material Icon Theme (MIT). */
const ProcessingIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width={size} height={size} {...props}><path stroke="#536dfe" strokeWidth="8" d="M10 26c16 0 16-20 0-20"/></svg>
);

export { ProcessingIcon };
