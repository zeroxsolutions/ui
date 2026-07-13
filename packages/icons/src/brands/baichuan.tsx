import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import { useFillId } from './internal/fill-ids';
import type { IconProps } from './internal/types';

/** Baichuan — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "Baichuan";
const COLOR_PRIMARY = "#FF6933";

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
      <path d="M7.333 2h-3.2l-2 4.333V17.8L0 22h5.2l2.028-4.2L7.333 2zm7.334 0h-5.2v20h5.2V2zM16.8 7.733H22V22h-5.2V7.733zM22 2h-5.2v4.133H22V2z" />
    </svg>
  );
};


const Color: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  const { id, fill } = useFillId(TITLE);
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
      <defs>
        <linearGradient id={id} x1="17.764%" x2="100%" y1="8.678%" y2="91.322%">
          <stop offset="0%" stopColor="#FEC13E" />
          <stop offset="100%" stopColor="#FF6933" />
        </linearGradient>
      </defs>
      <path
        d="M7.333 2h-3.2l-2 4.333V17.8L0 22h5.2l2.028-4.2L7.333 2zm7.334 0h-5.2v20h5.2V2zM16.8 7.733H22V22h-5.2V7.733zM22 2h-5.2v4.133H22V2z"
        fill={fill}
        fillRule="nonzero"
      />
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
      viewBox="0 0 45 24"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M2 2v2.712h8.136L9.57 7.198H4.26v14.576h2.712v-1.356h9.717v1.356h2.938V7.198H12.51l.677-2.486h8.362V2H2zm4.972 16.045v-2.938h9.717v2.825l-9.717.113zm0-8.361v2.937l9.717-.113V9.684H6.972zm21.921-7.571h-2.825v10.735c0 1.92-1.133 4.988-2.712 7.231L25.729 22c1.873-2.578 3.164-6.667 3.164-8.927V2.113zm4.067.904h2.712v16.61h-2.711l-.001-16.61zM42.452 2H39.74v19.661h2.712V2z" />
    </svg>
  );
};

type BaichuanMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Text: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const BaichuanMark = Base as BaichuanMarkType;
BaichuanMark.Mono = Base;
BaichuanMark.Color = Color;
BaichuanMark.Text = Text;
BaichuanMark.Avatar = makeAvatar(Base, { background: "#FF6933", color: "#fff", iconMultiple: 0.6 });
BaichuanMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 1 });
BaichuanMark.colorPrimary = COLOR_PRIMARY;

export { BaichuanMark };
