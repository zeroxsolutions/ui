import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** toon — Material Icon Theme (MIT). */
const ToonIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#ffc107" d="M1 9v6h6V9zm2 2h2v2H3zM9 1v6h6V1zm2 2h2v2h-2zM1 1h6v2H5v4H3V3H1zm8 8v6h2v-4h2V9zm4 2v4h2v-4z"/></svg>
);

export { ToonIcon };
