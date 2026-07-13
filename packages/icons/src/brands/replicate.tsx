import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import type { IconProps } from './internal/types';

/** Replicate — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "Replicate";
const COLOR_PRIMARY = "#EA2805";

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
      <path d="M22 10.552v2.26h-7.932V22H11.54V10.552H22zM22 2v2.264H4.528V22H2V2h20zm0 4.276V8.54H9.296V22H6.768V6.276H22z" />
    </svg>
  );
};




type ReplicateMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const ReplicateMark = Base as ReplicateMarkType;
ReplicateMark.Mono = Base;
ReplicateMark.Avatar = makeAvatar(Base, { background: "#EA2805", color: "#fff", iconMultiple: 0.6 });
ReplicateMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 0.8 });
ReplicateMark.colorPrimary = COLOR_PRIMARY;

export { ReplicateMark };
