import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** virtual — Material Icon Theme (MIT). */
const VirtualIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}>
    <path fill="#039be5" d="M28 24V6H4v18H2v2h28v-2Zm-8 0h-8v-2h8Zm6-4H6V8h20Z" />
  </svg>
);

export { VirtualIcon };
