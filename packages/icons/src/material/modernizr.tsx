import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** modernizr — Material Icon Theme (MIT). */
const ModernizrIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#e91e63" d="M10 10v4H6v4H2v4h12V10zm8 0v12h12a12 12 0 0 0-12-12" />
  </svg>
);

export { ModernizrIcon };
