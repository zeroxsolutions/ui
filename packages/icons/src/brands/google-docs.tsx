import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Google Docs — brand mark vendored from Simple Icons (CC0). */
const TITLE = "Google Docs";
const COLOR_PRIMARY = "#4285F4";
const PATH =
  "M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zm-.545 10.455H7.09v-1.364h7.09v1.364zm2.727-3.273H7.091v-1.364h9.818v1.364zm0-3.273H7.091V9.273h9.818v1.363zM14.727 6h6l-6-6v6z";

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

type GoogleDocsMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const GoogleDocsMark = Base as GoogleDocsMarkType;
GoogleDocsMark.Mono = Base;
GoogleDocsMark.Color = Color;
GoogleDocsMark.Avatar = makeAvatar(Base, { background: "#4285F4" });
GoogleDocsMark.colorPrimary = COLOR_PRIMARY;

export { GoogleDocsMark };
