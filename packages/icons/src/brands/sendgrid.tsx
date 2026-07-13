import type { FC } from 'react';

import { makeAvatar, type IconAvatarProps } from './internal/avatar';
import type { IconProps } from './internal/types';

/** SendGrid — brand mark vendored from gilbarbara/logos. */
const TITLE = "SendGrid";
const COLOR_PRIMARY = "#9DD6E3";
const VIEWBOX = "0 0 256 256";
const BODY =
  "<g>\n        <path d=\"M256.000405,0 L256.000405,170.666936 L170.666936,170.666936 L170.666936,255.996382 L0.00201096905,255.996382 L0.002,170.666 L0,170.666936 L0,85.3314569 L85.3334681,85.3314569 L85.3334681,0 L256.000405,0 Z\" fill=\"#9DD6E3\"></path>\n        <polygon fill=\"#3F72AB\" points=\"0.00201096905 255.996382 85.3354791 255.996382 85.3354791 170.662915 0.00201096905 170.662915\"></polygon>\n        <polygon fill=\"#00A9D1\" points=\"170.666936 170.666936 256.000405 170.666936 256.000405 85.3314569 170.666936 85.3314569\"></polygon>\n        <polygon fill=\"#00A9D1\" points=\"85.3334681 85.3334679 170.666936 85.3334679 170.666936 0 85.3334681 0\"></polygon>\n        <polygon fill=\"#2191C4\" points=\"85.3334681 170.664925 170.666936 170.664925 170.666936 85.3314569 85.3334681 85.3314569\"></polygon>\n        <polygon fill=\"#3F72AB\" points=\"170.666936 85.3334679 256.000405 85.3334679 256.000405 0 170.666936 0\"></polygon>\n    </g>";

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

type SendgridMarkType = FC<IconProps> & {
  Color: FC<IconProps>;
  Avatar: FC<IconAvatarProps>;
  colorPrimary: string;
};

const SendgridMark = Base as SendgridMarkType;
SendgridMark.Color = Base;
SendgridMark.Avatar = makeAvatar(Base, { background: "#9DD6E3" });
SendgridMark.colorPrimary = COLOR_PRIMARY;

export { SendgridMark };
