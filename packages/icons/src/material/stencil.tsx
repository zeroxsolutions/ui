import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** stencil — Material Icon Theme (MIT). */
const StencilIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#448aff" d="m8 12-6 8h22l6-8zm6.5-8L10 10h11l4.5-6zm3 24 4.5-6H11l-4.5 6z"/></svg>
);

export { StencilIcon };
