// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Line, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link BadgeExclamationPointIcon} through. */
type BadgeExclamationPointIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's badge-exclamation-point icon, which swells and wobbles side to side, then settles, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function BadgeExclamationPointIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // A swell of 0.09, less than the web twin's 0.1, which takes the badge past the canvas, which react-native-svg clips.
  const badge = useAnimatedProps(() => {
    const scale = 1 + 0.09 * progress.value;
    return transformProps({
      scaleX: scale,
      scaleY: scale,
      rotate: interpolate(progress.value, [0, 0.5, 1], [0, -3, 3]),
    });
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
      <AnimatedG animatedProps={badge}>
        <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <Line x1="12" x2="12" y1="8" y2="12" />
        <Line x1="12" x2="12.01" y1="16" y2="16" />
      </AnimatedG>
    </Svg>
  );
}

export { BadgeExclamationPointIcon };
export type { BadgeExclamationPointIconHandle };
