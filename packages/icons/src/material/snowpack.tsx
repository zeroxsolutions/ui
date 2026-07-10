import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** snowpack — Material Icon Theme (MIT). `.Light` = light-background variant. */
const SnowpackIcon = (({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -94 700 700" width={size} height={size} {...props}><path fill="#cfd8dc" d="M600.53 440.27 344.04 41.29a28.5 28.5 0 0 0-48.092 0L39.458 440.27a28.499 28.499 0 0 0 24.046 43.639h512.98a28.499 28.499 0 0 0 24.046-43.639M320 108.97l75.7 118.45H320l-56.998 56.998-33.842-33.842z"/></svg>
)) as FC<IconProps> & { Light: FC<IconProps> };

SnowpackIcon.Light = ({ size = '1em', ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -94 700 700" width={size} height={size} {...props}><path fill="#607d8b" d="M600.53 440.27 344.04 41.29a28.5 28.5 0 0 0-48.092 0L39.458 440.27a28.499 28.499 0 0 0 24.046 43.639h512.98a28.499 28.499 0 0 0 24.046-43.639M320 108.97l75.7 118.45H320l-56.998 56.998-33.842-33.842z"/></svg>
);

export { SnowpackIcon };
