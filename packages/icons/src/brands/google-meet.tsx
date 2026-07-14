import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Google Meet — brand mark vendored from Simple Icons (CC0). */
const TITLE = "Google Meet";
const COLOR_PRIMARY = "#00897B";
const PATH =
  "M5.53 2.13 0 7.75h5.53zm.398 0v5.62h7.608v3.65l5.47-4.45c-.014-1.22.031-2.25-.025-3.46-.148-1.09-1.287-1.47-2.236-1.36zM23.1 4.32c-.802.295-1.358.995-2.047 1.49-2.506 2.05-4.982 4.12-7.468 6.19 3.025 2.59 6.04 5.18 9.065 7.76 1.218.671 1.428-.814 1.328-1.64v-13a.828.828 0 0 0-.877-.825zM.038 8.15v7.7h5.53v-7.7zm13.577 8.1H6.008v5.62c3.864-.006 7.737.011 11.58-.009 1.02-.07 1.618-1.12 1.468-2.07v-2.51l-5.47-4.68v3.65zm-13.577 0c.02 1.44-.041 2.88.033 4.31.162.948 1.158 1.43 2.047 1.31h3.464v-5.62z";

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

type GoogleMeetMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const GoogleMeetMark = Base as GoogleMeetMarkType;
GoogleMeetMark.Mono = Base;
GoogleMeetMark.Color = Color;
GoogleMeetMark.Avatar = makeAvatar(Base, { background: "#00897B" });
GoogleMeetMark.colorPrimary = COLOR_PRIMARY;

export { GoogleMeetMark };
