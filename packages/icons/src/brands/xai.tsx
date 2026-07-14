import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** xAI — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "xAI";
const COLOR_PRIMARY = "#000000";

const Artwork: FC = () => (
  <>
    <path d="M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z"></path>
  </>
);

const Base: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg fill="currentColor" fillRule="evenodd" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{TITLE}</title>
    <Artwork />
  </svg>
);

const Color: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg fill={COLOR_PRIMARY} fillRule="evenodd" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{TITLE}</title>
    <Artwork />
  </svg>
);

type XaiMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const XaiMark = Base as XaiMarkType;
XaiMark.Mono = Base;
XaiMark.Color = Color;
XaiMark.Avatar = makeAvatar(Base, { background: "#000000" });
XaiMark.colorPrimary = COLOR_PRIMARY;

export { XaiMark };
