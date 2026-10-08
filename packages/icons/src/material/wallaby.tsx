import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** wallaby — Material Icon Theme (MIT). */
const WallabyIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#4caf50" d="M16 2v14H2v14h28V2z" />
  </svg>
);

export { WallabyIcon };
