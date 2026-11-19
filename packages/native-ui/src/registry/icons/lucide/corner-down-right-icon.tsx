// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CornerDownRightIcon} through. */
type CornerDownRightIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Half the web twin's 450 ms. */
const TIMING: IconTiming = { duration: 225 };

/** How far it moves the way it points, in the 24-unit viewBox: less than the web twin's 2, which would take its tip past the canvas. */
const SHIFT = 1.5;

/**
 * Lucide's corner-down-right icon, which stretches the way it points and moves a little that way, and back when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function CornerDownRightIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const glyph = useAnimatedProps(() =>
    transformProps({ x: SHIFT * progress.value, scaleX: 1 + 0.15 * progress.value }),
  );

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
      <AnimatedG animatedProps={glyph}>
        <Path d="m15 10 5 5-5 5" />
        <Path d="M4 4v7a4 4 0 0 0 4 4h12" />
      </AnimatedG>
    </Svg>
  );
}

export { CornerDownRightIcon };
export type { CornerDownRightIconHandle };
