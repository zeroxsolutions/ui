// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WavesArrowUpIcon} through. */
type WavesArrowUpIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * How far the arrow rises and its size about the shaft's foot (12, 10) there, and how much shorter the shaft gets
 * still: the web twin rises by 3 at full size, which would take the arrowhead past the canvas, which react-native-svg
 * clips, so the arrow rises by 2.5, shrinking about its foot. The shaft's shortening is the web twin's.
 */
const RISE = 2.5;
const SIZE = 0.8;
const SHAFT = 0.85;

/**
 * Lucide's waves-arrow-up icon, whose arrow rises out of the waves, its shaft shortening, and back when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function WavesArrowUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const shaft = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE * SHAFT) * progress.value;
    return transformProps({ y: -RISE * progress.value, scaleX: size, scaleY: size, originX: 12, originY: 10 });
  });
  const head = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({ y: -RISE * progress.value, scaleX: size, scaleY: size, originX: 12, originY: 10 });
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
      <AnimatedPath d="M12 2v8" animatedProps={shaft} />
      <AnimatedPath d="m8 6 4-4 4 4" animatedProps={head} />
      <Path d="M2 15c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <Path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </Svg>
  );
}

export { WavesArrowUpIcon };
export type { WavesArrowUpIconHandle };
