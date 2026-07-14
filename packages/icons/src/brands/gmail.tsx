import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Gmail — brand mark vendored from Simple Icons (CC0). */
const TITLE = "Gmail";
const COLOR_PRIMARY = "#EA4335";
const PATH =
  "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z";

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

type GmailMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const GmailMark = Base as GmailMarkType;
GmailMark.Mono = Base;
GmailMark.Color = Color;
GmailMark.Avatar = makeAvatar(Base, { background: "#EA4335" });
GmailMark.colorPrimary = COLOR_PRIMARY;

export { GmailMark };
