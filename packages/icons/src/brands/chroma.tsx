import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Chroma — brand mark vendored from gilbarbara/logos. */
const TITLE = "Chroma";
const COLOR_PRIMARY = "#FFDE2D";
const VIEWBOX = "0 0 256 164";
const BODY =
  "<g>\n        <ellipse fill=\"#FFDE2D\" cx=\"170.666795\" cy=\"81.9198362\" rx=\"85.3332053\" ry=\"81.9198362\"></ellipse>\n        <ellipse fill=\"#327EFF\" cx=\"85.3332053\" cy=\"81.9198362\" rx=\"85.3332053\" ry=\"81.9198362\"></ellipse>\n        <path d=\"M170.666795,81.9199642 C170.666795,127.163394 132.461431,163.83916 85.3330773,163.83916 L85.3330773,81.9199642 L170.666795,81.9199642 Z M85.3332053,81.9198362 C85.3332053,36.6767906 123.538185,8.95998209e-05 170.666795,8.95998209e-05 L170.666795,81.9198362 L85.3332053,81.9198362 Z\" fill=\"#FF6446\"></path>\n    </g>";

const Base: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg
    aria-label={TITLE}
    height={size}
    viewBox={VIEWBOX}
    width={size}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    dangerouslySetInnerHTML={{ __html: BODY }}
  />
);

type ChromaMarkType = FC<IconProps> & {
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const ChromaMark = Base as ChromaMarkType;
ChromaMark.Color = Base;
ChromaMark.Avatar = makeAvatar(Base, { background: "#FFDE2D" });
ChromaMark.colorPrimary = COLOR_PRIMARY;

export { ChromaMark };
