// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RadicalIcon} through. */
type RadicalIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the radical, in the 24-unit viewBox. */
const ROOT = 37.78;

/** The way out is quick, so the way back is what draws the icon in. */
const DRAW_TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's radical icon, drawn in again from its foot, when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function RadicalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, DRAW_TIMING);
  const root = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(ROOT, drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
  });

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedPath
        d="M3 12h3.28a1 1 0 0 1 .948.684l2.298 7.934a.5.5 0 0 0 .96-.044L13.82 4.771A1 1 0 0 1 14.792 4H21"
        animatedProps={root}
      />
    </Svg>
  );
}

export { RadicalIcon };
export type { RadicalIconHandle };
