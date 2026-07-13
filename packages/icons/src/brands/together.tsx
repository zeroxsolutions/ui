import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import { makeCombine, type IconCombineProps } from './internal/combine';
import type { IconProps } from './internal/types';

/** together.ai — brand mark vendored from @lobehub/icons (MIT). */
const TITLE = "together.ai";
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
      <path d="M23.197 4.503A6 6 0 0015 2.307a5.973 5.973 0 00-2.995 4.933l5.996.008v.515h-5.996c.039.937.298 1.87.8 2.74a6 6 0 1010.39-6z" />
      <path d="M.805 4.5A6 6 0 003 12.697a5.972 5.972 0 005.77.127L5.779 7.627l.446-.257 2.997 5.192A6 6 0 10.804 4.5z" />
      <path d="M12 23.894a6 6 0 005.999-6c0-2.13-1.1-3.996-2.775-5.06l-3.005 5.189-.444-.258 2.997-5.192A6 6 0 1012 23.894z" />
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
      <path
        d="M23.197 4.503A6 6 0 0015 2.307a5.973 5.973 0 00-2.995 4.933l5.996.008v.515h-5.996c.039.937.298 1.87.8 2.74a6 6 0 1010.39-6z"
        fill="#EF2CC1"
      />
      <path
        d="M.805 4.5A6 6 0 003 12.697a5.972 5.972 0 005.77.127L5.779 7.627l.446-.257 2.997 5.192A6 6 0 10.804 4.5z"
        fill="#CAAEF5"
      />
      <path
        d="M12 23.894a6 6 0 005.999-6c0-2.13-1.1-3.996-2.775-5.06l-3.005 5.189-.444-.258 2.997-5.192A6 6 0 1012 23.894z"
        fill="#FC4C02"
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
      viewBox="0 0 99 24"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <title>{TITLE}</title>
      <g clipPath="url(#a)" clipRule="evenodd">
        <path d="M2 7.158h1.43V2.213h1.968v4.945h2.25v1.734h-2.25v9.28H3.43v-9.28H2V7.158zM13.083 6.876c3.14 0 5.717 2.6 5.717 5.788s-2.577 5.788-5.717 5.788c-3.14 0-5.717-2.601-5.717-5.788 0-3.186 2.577-5.788 5.717-5.788zm0 9.748c2.132 0 3.796-1.687 3.796-3.96 0-2.273-1.664-3.96-3.796-3.96-2.132 0-3.797 1.687-3.797 3.96 0 2.273 1.665 3.96 3.797 3.96zM25.238 24c-2.718 0-5.365-1.898-5.365-4.991h1.921c.164 2.085 1.64 3.186 3.446 3.186 2.085 0 3.678-1.452 3.678-3.89v-2.033c-.75 1.359-2.39 2.18-3.866 2.18-3.14 0-5.53-2.578-5.53-5.789 0-3.21 2.39-5.788 5.53-5.788 1.476 0 3.117.82 3.866 2.18V7.156h1.969v11.148c0 3.304-2.53 5.694-5.647 5.694l-.002.001zm.024-7.375c2.133 0 3.797-1.688 3.797-3.96 0-2.274-1.664-3.961-3.797-3.961-2.132 0-3.796 1.687-3.796 3.96 0 2.273 1.664 3.96 3.796 3.96zM41.521 14.351l1.593.89c-1.1 2.063-2.975 3.211-5.132 3.211-3.092 0-5.623-2.601-5.623-5.788 0-3.186 2.53-5.788 5.623-5.788 3.093 0 5.366 2.25 5.366 6.186h-9.091c.187 2.11 1.805 3.562 3.725 3.562 1.92 0 2.766-.82 3.538-2.273h.001zm-7.148-2.858h6.89c-.235-1.57-1.406-2.835-3.28-2.835-1.735 0-3.141 1.148-3.61 2.835zM43.56 7.158h1.43V2.213h1.97v4.945h2.248v1.734H46.96v9.28H44.99v-9.28h-1.43V7.158zM54.827 8.634c-1.734 0-2.952 1.336-2.952 3.515v6.023h-1.968V2.213h1.968V8.87c.75-1.195 1.969-1.991 3.609-1.991 2.53 0 3.89 1.805 3.89 3.937v7.357h-1.968v-6.865c0-1.687-.96-2.671-2.578-2.671v-.002zM69.945 14.351l1.593.89c-1.101 2.063-2.976 3.211-5.132 3.211-3.093 0-5.624-2.601-5.624-5.788 0-3.186 2.531-5.788 5.624-5.788 3.092 0 5.365 2.25 5.365 6.186H62.68c.188 2.11 1.805 3.562 3.726 3.562 1.92 0 2.765-.82 3.537-2.273h.002zm-7.148-2.858h6.889c-.235-1.57-1.406-2.835-3.28-2.835-1.734 0-3.141 1.148-3.61 2.835zM79.239 9.312c-.376-.328-.938-.492-1.5-.492-1.64 0-2.577 1.43-2.577 3.351v6h-1.969V7.156h1.969v1.875c.539-1.195 1.617-2.11 3.047-2.11.702 0 1.335.235 1.734.54l-.703 1.85h-.001zM93.094 7.158V18.17h-1.969v-1.898c-.75 1.359-2.39 2.18-3.866 2.18-3.141 0-5.53-2.578-5.53-5.789 0-3.21 2.39-5.788 5.53-5.788 1.476 0 3.116.82 3.866 2.18V7.157h1.969zm-5.625 9.466c2.133 0 3.797-1.687 3.797-3.96 0-2.273-1.664-3.96-3.797-3.96-2.132 0-3.796 1.687-3.796 3.96 0 2.273 1.664 3.96 3.796 3.96zM97.289 7.157V18.17H95.32V7.157h1.969zM94.993 3.313c0-.703.609-1.313 1.311-1.313.703 0 1.312.61 1.312 1.313s-.586 1.312-1.312 1.312a1.31 1.31 0 01-1.311-1.312zM78.059 17c0-.703.609-1.313 1.311-1.313.703 0 1.312.61 1.312 1.312 0 .703-.586 1.312-1.312 1.312a1.31 1.31 0 01-1.311-1.312z" />
      </g>
      <defs>
        <clipPath id="a">
          <path d="M0 0h99v24H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

type TogetherMarkType = FC<IconProps> & {
  Mono: FC<IconProps>;
  Color: FC<IconProps>;
  Text: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  Combine: FC<IconCombineProps>;
  colorPrimary: string;
};

const TogetherMark = Base as TogetherMarkType;
TogetherMark.Mono = Base;
TogetherMark.Color = Color;
TogetherMark.Text = Text;
TogetherMark.Avatar = makeAvatar(Base, { background: "#000", color: "#000", iconMultiple: 0.75 });
TogetherMark.Combine = makeCombine(Base, TITLE, { spaceMultiple: 0.2, textMultiple: 0.85 });
TogetherMark.colorPrimary = COLOR_PRIMARY;

export { TogetherMark };
