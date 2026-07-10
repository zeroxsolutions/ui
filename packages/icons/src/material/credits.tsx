import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** credits — Material Icon Theme (MIT). */
const CreditsIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#9ccc65" d="M4 2h24v4H4zm6 6h12v4H10zm-6 6h24v4H4zm6 6h12v4H10zm-6 6h24v4H4z"/></svg>
);

export { CreditsIcon };
