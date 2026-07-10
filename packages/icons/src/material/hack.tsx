import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** hack — Material Icon Theme (MIT). */
const HackIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#607d8b" d="m14 9-8 8V9l8-8zm12 12L16 31v-8l10-10z"/><path fill="#ffa000" d="m6 20 8-8v8"/><path fill="#607d8b" d="m6 30 8-8H6"/><path fill="#eceff1" d="m16 20 10-10H16"/></svg>
);

export { HackIcon };
