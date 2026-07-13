import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** Heroku — brand mark vendored from svgl. */
const TITLE = "Heroku";
const COLOR_PRIMARY = "#430098";
const VIEWBOX = "0 0 256 284.4";
const BODY =
  "<path fill=\"#430098\" d=\"M230 0c14 0 26 11 26 25v234c0 14-11 25-25 25H26c-14 0-26-11-26-25V26C0 12 11 0 25 0h1zm0 14H26c-7 0-12 5-12 11v234c0 6 5 11 11 11h205c7 0 12-5 12-11V26c0-7-5-12-12-12zM64 185l32 28-32 29zM92 43v80c15-4 34-9 54-9 17 0 28 7 34 12 12 13 12 28 12 30v86h-28v-85c-1-7-4-15-18-15-29 0-61 14-62 15l-20 9V43zm100 0c-2 16-8 31-21 46h-29c11-15 18-30 22-46z\"/>";

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

type HerokuMarkType = FC<IconProps> & {
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const HerokuMark = Base as HerokuMarkType;
HerokuMark.Color = Base;
HerokuMark.Avatar = makeAvatar(Base, { background: "#430098" });
HerokuMark.colorPrimary = COLOR_PRIMARY;

export { HerokuMark };
