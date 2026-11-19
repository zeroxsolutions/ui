// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Easing, Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { dash, useIconMotion, type AnimatedIconProps, type IconTiming, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link WorkflowIcon} through. */
type WorkflowIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** The length of a box outline, in the 24-unit viewBox. */
const BOX = 28.57;

/** The length of the line between the boxes, in the 24-unit viewBox. */
const LINK = 11.14;

/** The way out is quick, so the way back is what draws the icon in. */
const DRAW_TIMING: IconTiming = { duration: 200, outEasing: Easing.out(Easing.exp) };

/**
 * Lucide's workflow icon, whose boxes and the link between them are drawn in again, one after another, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function WorkflowIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, DRAW_TIMING);
  const source = useAnimatedProps(() => {
    const drawn = 1 - progress.value;
    return { ...dash(BOX, drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
  });
  const link = useAnimatedProps(() => {
    const drawn = Math.max(0, (1 - progress.value - 0.36) / 0.64);
    return { ...dash(LINK, drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
  });
  const target = useAnimatedProps(() => {
    const drawn = Math.max(0, (1 - progress.value - 0.12) / 0.88);
    return { ...dash(BOX, drawn), opacity: interpolate(drawn, [0, 0.25], [0, 1], Extrapolation.CLAMP) };
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
      <AnimatedRect x="3" y="3" width="8" height="8" rx="2" animatedProps={source} />
      <AnimatedPath d="M7 11v4a2 2 0 0 0 2 2h4" animatedProps={link} />
      <AnimatedRect x="13" y="13" width="8" height="8" rx="2" animatedProps={target} />
    </Svg>
  );
}

export { WorkflowIcon };
export type { WorkflowIconHandle };
