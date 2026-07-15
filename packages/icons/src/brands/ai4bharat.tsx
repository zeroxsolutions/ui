import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import type { IconProps } from './internal/types';

/**
 * AI4Bharat - placeholder brand mark. AI4Bharat publishes no icon in
 * @lobehub/icons and no standalone wordmark, so this is a neutral spark glyph
 * (mono, currentColor) standing in for the provider until an official mark
 * exists - matching how the downstream app treated this preset.
 */
const TITLE = 'AI4Bharat';
const COLOR_PRIMARY = '#1a1a1a';

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
      <path d="M12 1.5l2.6 6.51a3 3 0 001.89 1.79L23 12l-6.51 2.2a3 3 0 00-1.89 1.79L12 22.5l-2.6-6.51a3 3 0 00-1.89-1.79L1 12l6.51-2.2a3 3 0 001.89-1.79L12 1.5z" />
    </svg>
  );
};

type Ai4bharatMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const Ai4bharatMark = Base as Ai4bharatMarkType;
Ai4bharatMark.Mono = Base;
Ai4bharatMark.Avatar = makeAvatar(Base, { background: COLOR_PRIMARY, color: '#fff', iconMultiple: 0.6 });
Ai4bharatMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 0.75 });
Ai4bharatMark.colorPrimary = COLOR_PRIMARY;

export { Ai4bharatMark };
