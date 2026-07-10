import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** templ — Material Icon Theme (MIT). */
const TemplIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#ffd54f" d="M8.125 24.313 1 16l7.125-8.313 3 2.625L6.25 16l4.875 5.688ZM24 7.687 31.125 16 24 24.313l-3-2.625L25.875 16 21 10.312ZM16 4l-4 24h4l4-24z"/></svg>
);

export { TemplIcon };
