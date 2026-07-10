import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** javaclass — Material Icon Theme (MIT). */
const JavaclassIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#1e88e5" d="M4 26h24v2H4zM28 4H7a1 1 0 0 0-1 1v13a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-4h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 8h-4V6h4Z"/></svg>
);

export { JavaclassIcon };
