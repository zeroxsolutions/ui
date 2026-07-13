import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import type { IconProps } from './internal/types';

/** vLLM — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "vLLM";
const COLOR_PRIMARY = "#fff";

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
      <path d="M0 4.973h9.324V23L0 4.973z" />
      <path d="M13.986 4.351L22.378 0l-6.216 23H9.324l4.662-18.649z" />
    </svg>
  );
};


const Color: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  return (
    <svg
      height={size}
      style={{ flex: 'none', lineHeight: 1, ...style }}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M0 4.973h9.324V23L0 4.973z" fill="#FDB515" />
      <path d="M13.986 4.351L22.378 0l-6.216 23H9.324l4.662-18.649z" fill="#30A2FF" />
    </svg>
  );
};

const Text: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  return (
    <svg
      fill="currentColor"
      fillRule="evenodd"
      height={size}
      style={{ flex: 'none', lineHeight: 1, ...style }}
      viewBox="0 0 52 24"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M4.8 2H2v20h12.4v-2.4H4.8V2zM20 2h-2.8v20h12.4v-2.4H20V2zM32 22V2h3.6L41 13.435 46.4 2H50v20h-2.8V5.388l-5.4 10.989h-1.6L34.8 5.387V22H32z" />
    </svg>
  );
};

type VllmMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Text: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const VllmMark = Base as VllmMarkType;
VllmMark.Mono = Base;
VllmMark.Color = Color;
VllmMark.Text = Text;
VllmMark.Avatar = makeAvatar(Base, { background: "#000", color: "#fff", iconMultiple: 0.6 });
VllmMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.3, textMultiple: 0.85 });
VllmMark.colorPrimary = COLOR_PRIMARY;

export { VllmMark };
