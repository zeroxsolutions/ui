import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** histoire — Material Icon Theme (MIT). */
const HistoireIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" clipRule="evenodd" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#1de9b6" d="M8.814 1.004a.19.19 0 0 0-.162.09l-5.61 7.529A.247.247 0 0 0 3.25 9H7v5.817c-.001.204.266.25.373.076l5.592-7.567c.087-.14.025-.326-.14-.326H9V1.194a.19.19 0 0 0-.185-.19z"/></svg>
);

export { HistoireIcon };
