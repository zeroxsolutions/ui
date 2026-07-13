import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import type { IconProps } from './internal/types';

/** Yi — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "Yi";
const COLOR_PRIMARY = "#003425";

const Base: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      height={size}
      style={{ flex: 'none', lineHeight: 1, ...style }}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M18.62 13.927c.611 0 1.107.505 1.107 1.128v5.817c0 .623-.496 1.128-1.108 1.128a1.118 1.118 0 01-1.108-1.128v-5.817c0-.623.496-1.128 1.108-1.128zM16.59 3.052a1.094 1.094 0 011.562-.129c.466.404.522 1.116.126 1.59l-5.938 7.111v9.147c0 .624-.496 1.129-1.108 1.129a1.118 1.118 0 01-1.108-1.129v-9.477l.003-.088.01-.087c.015-.232.102-.462.261-.654l6.192-7.413zM2.906 2.256a1.094 1.094 0 011.559.157l4.387 5.45a1.142 1.142 0 01-.155 1.587 1.094 1.094 0 01-1.559-.157l-4.387-5.45a1.144 1.144 0 01.06-1.498l.095-.09z" />
      <ellipse cx="20.146" cy="10.692" rx="1.354" ry="1.379" />
    </svg>
  );
};


const Color: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      height={size}
      style={{ flex: 'none', lineHeight: 1, ...style }}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M18.62 13.927c.611 0 1.107.505 1.107 1.128v5.817c0 .623-.496 1.128-1.108 1.128a1.118 1.118 0 01-1.108-1.128v-5.817c0-.623.496-1.128 1.108-1.128zM16.59 3.052a1.094 1.094 0 011.562-.129c.466.404.522 1.116.126 1.59l-5.938 7.111v9.147c0 .624-.496 1.129-1.108 1.129a1.118 1.118 0 01-1.108-1.129v-9.477l.003-.088.01-.087c.015-.232.102-.462.261-.654l6.192-7.413zM2.906 2.256a1.094 1.094 0 011.559.157l4.387 5.45a1.142 1.142 0 01-.155 1.587 1.094 1.094 0 01-1.559-.157l-4.387-5.45a1.144 1.144 0 01.06-1.498l.095-.09z" />
      <ellipse cx="20.146" cy="10.692" fill="#00FF25" rx="1.354" ry="1.379" />
    </svg>
  );
};


type YiMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const YiMark = Base as YiMarkType;
YiMark.Mono = Base;
YiMark.Color = Color;
YiMark.Avatar = makeAvatar(Base, { background: "#003425", color: "#fff", iconMultiple: 0.6 });
YiMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 0.8 });
YiMark.colorPrimary = COLOR_PRIMARY;

export { YiMark };
