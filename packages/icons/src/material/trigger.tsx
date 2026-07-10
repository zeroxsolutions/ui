import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** trigger — Material Icon Theme (MIT). */
const TriggerIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#4caf50" fillRule="evenodd" d="M11.158 13.51 16 5l12 21.09H4l4.842-8.51 3.425 2.007-1.416 2.49h10.298L16 13.027l-1.417 2.49z" clipRule="evenodd"/></svg>
);

export { TriggerIcon };
