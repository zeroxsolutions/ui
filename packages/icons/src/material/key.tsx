import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** key — Material Icon Theme (MIT). */
const KeyIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#26a69a" d="M30 14H17.738a8 8 0 1 0 0 4H24v4h4v-4h2Zm-20 5a3 3 0 1 1 3-3 3.003 3.003 0 0 1-3 3"/></svg>
);

export { KeyIcon };
