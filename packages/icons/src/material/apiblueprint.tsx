import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** apiblueprint — Material Icon Theme (MIT). */
const ApiblueprintIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><rect width="12" height="12" x="10" y="2" fill="#42a5f5" rx="6"/><rect width="12" height="12" x="18" y="18" fill="#42a5f5" rx="6"/><rect width="12" height="12" x="2" y="18" fill="#42a5f5" rx="6"/><path fill="none" stroke="#42a5f5" strokeMiterlimit="10" strokeWidth="3" d="m16 8 8 16M16 8 8 24"/></svg>
);

export { ApiblueprintIcon };
