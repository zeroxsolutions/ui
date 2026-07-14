import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** ClickUp — brand mark vendored from Simple Icons (CC0). */
const TITLE = "ClickUp";
const COLOR_PRIMARY = "#7B68EE";
const PATH =
  "M2 18.439l3.69-2.828c1.961 2.56 4.044 3.739 6.363 3.739 2.307 0 4.33-1.166 6.203-3.704L22 18.405C19.298 22.065 15.941 24 12.053 24 8.178 24 4.788 22.078 2 18.439zM12.04 6.15l-6.568 5.66-3.036-3.52L12.055 0l9.543 8.296-3.05 3.509z";

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

type ClickupMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const ClickupMark = Base as ClickupMarkType;
ClickupMark.Mono = Base;
ClickupMark.Color = Color;
ClickupMark.Avatar = makeAvatar(Base, { background: "#7B68EE" });
ClickupMark.colorPrimary = COLOR_PRIMARY;

export { ClickupMark };
