import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Vercel — brand mark vendored from Simple Icons (CC0). */
const TITLE = "Vercel";
const COLOR_PRIMARY = "#000000";
const PATH =
  "m12 1.608 12 20.784H0Z";

const Base: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg fill="currentColor" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{TITLE}</title>
    <path d={PATH} />
  </svg>
);

const Color: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg fill={COLOR_PRIMARY} height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{TITLE}</title>
    <path d={PATH} />
  </svg>
);

type VercelMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const VercelMark = Base as VercelMarkType;
VercelMark.Mono = Base;
VercelMark.Color = Color;
VercelMark.Avatar = makeAvatar(Base, { background: "#000000" });
VercelMark.colorPrimary = COLOR_PRIMARY;

export { VercelMark };
