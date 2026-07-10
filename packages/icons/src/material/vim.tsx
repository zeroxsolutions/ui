import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** vim — Material Icon Theme (MIT). */
const VimIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#43a047" d="M22.19 4H16v4h2.19L12 14.19V8h2V4H2v4h2v20h4v-.01l.01.01L28 8V4z"/></svg>
);

export { VimIcon };
