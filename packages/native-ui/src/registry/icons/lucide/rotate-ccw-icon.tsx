// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link RotateCcwIcon} through. */
type RotateCcwIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's rotate ccw icon, which turns back a little and returns, when started. Hidden from a screen reader:
 * the control around it says what it does.
 */
function RotateCcwIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // 12 degrees, less than the web twin's 50, which takes the arrowhead past the canvas, which react-native-svg clips.
  const whole = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ rotate: -12 * p, originY: 12.007 }) };
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
      <AnimatedG animatedProps={whole}>
        <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <Path d="M3 3v5h5" />
      </AnimatedG>
    </Svg>
  );
}

export { RotateCcwIcon };
export type { RotateCcwIconHandle };
