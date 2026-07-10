import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** luau — Material Icon Theme (MIT). */
const LuauIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size} {...props}><path fill="#03a9f4" d="M22.495 6.331 6.33 2 2 18.164l16.164 4.33z"/><path fill="#fafafa" d="M19.933 7.81 16.7 6.944l-.866 3.233 3.233.866z"/></svg>
);

export { LuauIcon };
