import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** san — Material Icon Theme (MIT). */
const SanIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#01579b" d="M28 17.898 4 23.316V30l24-5.418Zm0-10.623L4 12.694v6.683l24-5.418Z"/><path fill="#b3e5fc" d="M28 13.926 4 8.684V2l24 5.242Zm0 10.623L4 19.307v-6.684l24 5.242Z"/></svg>
);

export { SanIcon };
