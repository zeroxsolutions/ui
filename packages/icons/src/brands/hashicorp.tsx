import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** HashiCorp — brand mark vendored from Simple Icons (CC0). */
const TITLE = "HashiCorp";
const COLOR_PRIMARY = "#000000";
const PATH =
  "M10.114 4.094 4.215 7.5v13.09L.666 18.542V5.45L10.114 0v4.094zm3.772 13.37 3.549-2.049V2.05L13.885 0v10.426h-3.77v-3.89L6.562 8.585v13.357l3.551 2.054V13.599h3.772v3.865zM19.783 3.41V16.5l-5.897 3.405V24l9.448-5.45V5.458l-3.551-2.05z";

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

type HashicorpMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const HashicorpMark = Base as HashicorpMarkType;
HashicorpMark.Mono = Base;
HashicorpMark.Color = Color;
HashicorpMark.Avatar = makeAvatar(Base, { background: "#000000" });
HashicorpMark.colorPrimary = COLOR_PRIMARY;

export { HashicorpMark };
