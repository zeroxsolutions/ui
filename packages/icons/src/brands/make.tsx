import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import { useFillIds } from './internal/fill-ids';
import type { IconProps } from './internal/types';

/** Make — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "Make";
const COLOR_PRIMARY = "#ff009a";

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
      <path d="M6.989 4.036L.062 17.818a.577.577 0 00.257.774l3.733 1.876a.577.577 0 00.775-.256L11.753 6.43a.577.577 0 00-.257-.775L7.763 3.78a.575.575 0 00-.774.257z" />
      <path d="M19.245 3.832h4.179c.318 0 .577.26.577.577v15.425a.578.578 0 01-.577.578h-4.179a.578.578 0 01-.577-.578V4.41c0-.318.259-.577.577-.577z" />
      <path d="M12.815 4.085L9.85 19.108a.576.576 0 00.453.677l4.095.826c.314.063.62-.14.681-.454l2.964-15.022a.577.577 0 00-.453-.677l-4.096-.827a.577.577 0 00-.68.454z" />
    </svg>
  );
};


const Color: FC<IconProps> = ({ size = '1em', style, ...rest }) => {
  const [a, b, c] = useFillIds(TITLE, 3);
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

      <path
        d="M6.989 4.036L.062 17.818a.577.577 0 00.257.774l3.733 1.876a.577.577 0 00.775-.256L11.753 6.43a.577.577 0 00-.257-.775L7.763 3.78a.575.575 0 00-.774.257z"
        fill={a.fill}
      />
      <path
        d="M19.245 3.832h4.179c.318 0 .577.26.577.577v15.425a.578.578 0 01-.577.578h-4.179a.578.578 0 01-.577-.578V4.41c0-.318.259-.577.577-.577z"
        fill={b.fill}
      />
      <path
        d="M12.815 4.085L9.85 19.108a.576.576 0 00.453.677l4.095.826c.314.063.62-.14.681-.454l2.964-15.022a.577.577 0 00-.453-.677l-4.096-.827a.577.577 0 00-.68.454z"
        fill={c.fill}
      />

      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id={a.id} x1="1.5" x2="12" y1="19.5" y2="0">
          <stop stopColor="#F0F" />
          <stop offset=".17" stopColor="#E90CF9" />
          <stop offset=".54" stopColor="#C023ED" />
          <stop offset=".73" stopColor="#B02DE9" />
          <stop offset="1" stopColor="#B02DE9" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={b.id} x1="0" x2="24" y1="24" y2="0">
          <stop stopColor="#B02DE9" />
          <stop offset=".02" stopColor="#B02DE9" />
          <stop offset=".8" stopColor="#6D00CC" />
          <stop offset="1" stopColor="#6D00CC" />
        </linearGradient>
        <linearGradient gradientUnits="userSpaceOnUse" id={c.id} x1="0" x2="24" y1="24" y2="0">
          <stop stopColor="#F0F" />
          <stop offset=".02" stopColor="#F0F" />
          <stop offset=".09" stopColor="#E90CF9" />
          <stop offset=".23" stopColor="#C023ED" />
          <stop offset=".3" stopColor="#B02DE9" />
          <stop offset=".42" stopColor="#A42BE3" />
          <stop offset=".63" stopColor="#8626D5" />
          <stop offset=".85" stopColor="#6021C3" />
          <stop offset="1" stopColor="#6021C3" />
        </linearGradient>
      </defs>
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
      viewBox="0 0 79 24"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <path d="M7.28 11.473v9.603a.566.566 0 01-.565.565h-4.15A.565.565 0 012 21.076V5.912c0-.312.254-.566.565-.566h4.15c.311 0 .565.254.565.566v1.194c1.042-1.303 2.509-2.118 4.562-2.118 1.923 0 3.585.782 4.595 2.249 1.238-1.467 2.998-2.25 5.15-2.25 3.65 0 6.159 2.152 6.159 6.258v9.83a.566.566 0 01-.566.566h-4.149a.565.565 0 01-.565-.565v-8.723c0-1.792-1.01-2.671-2.38-2.671-1.14 0-2.053.717-2.575 1.792v9.603a.566.566 0 01-.565.565h-4.15a.565.565 0 01-.565-.565v-8.722c0-1.793-1.01-2.672-2.38-2.672-1.172 0-2.053.717-2.575 1.792M34.685 21.968c-3.063 0-5.638-2.021-5.638-5.15 0-2.868 1.89-4.205 5.41-5.117l4.498-1.173c-.13-1.075-.978-1.596-2.347-1.596-1.212 0-2.084.463-2.487 1.391a.575.575 0 01-.657.345L29.9 9.822a.569.569 0 01-.404-.746c1.023-2.768 3.867-4.219 7.307-4.219 4.627 0 7.3 2.184 7.3 6.029v10.19a.565.565 0 01-.565.565h-3.934a.566.566 0 01-.565-.552l-.02-.85-.032.034c-1.336 1.14-2.64 1.694-4.303 1.694m1.336-4.074c.685 0 1.206-.196 1.988-.652l.912-.555.033-2.64-2.347.652c-1.597.457-2.314.848-2.314 1.76 0 1.01.879 1.434 1.727 1.434M52.534 13.95l-1.597 1.467v5.659a.565.565 0 01-.566.565h-4.05a.565.565 0 01-.566-.565V.566c0-.312.253-.566.565-.566h4.051c.312 0 .566.254.566.565v9.278l4.726-4.348a.569.569 0 01.383-.15h5.002c.517 0 .762.635.382.983l-4.853 4.427 5.534 10.048a.565.565 0 01-.495.838h-4.729a.565.565 0 01-.501-.304l-3.851-7.388-.001.001z" />
      <path d="M69.726 22c-4.53 0-8.67-2.835-8.67-8.572 0-5.41 3.977-8.538 8.344-8.538 4.367 0 7.822 3.16 7.952 8.147.014.527.023.894.027 1.155a.564.564 0 01-.565.572H66.271c.163 1.956 1.728 3.194 3.716 3.194 1.415 0 2.574-.588 3.387-1.651a.56.56 0 01.759-.124l2.633 1.763a.572.572 0 01.15.796C75.507 20.82 73.18 22 69.728 22M66.37 11.57h5.704c-.032-1.857-1.4-2.671-2.835-2.671-1.336 0-2.704.783-2.867 2.672" />
    </svg>
  );
};

type MakeMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Text: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const MakeMark = Base as MakeMarkType;
MakeMark.Mono = Base;
MakeMark.Color = Color;
MakeMark.Text = Text;
MakeMark.Avatar = makeAvatar(Base, { background: "#ff009a", color: "#fff", iconMultiple: 0.75 });
MakeMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 0.8 });
MakeMark.colorPrimary = COLOR_PRIMARY;

export { MakeMark };
