import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** amplify — Material Icon Theme (MIT). */
const AmplifyIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#ff9800" d="M14 10 5 28h12l-2-4h-4l3-6 5 10h4zm1-2 2-4 12 24h-4l-8-16z"/></svg>
);

export { AmplifyIcon };
