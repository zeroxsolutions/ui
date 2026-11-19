// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link GraduationCapIcon} through. */
type GraduationCapIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's graduation-cap icon, which lifts and tilts while its tassel swings, and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function GraduationCapIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cap = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, -2, 2]), y: -2 * progress.value }),
  );
  const tassel = useAnimatedProps(() =>
    transformProps({ rotate: interpolate(progress.value, [0, 0.5, 1], [0, 15, -10]), originX: 22, originY: 10 }),
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
      <AnimatedG animatedProps={cap}>
        <Path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <AnimatedPath d="M22 10v6" animatedProps={tassel} />
        <Path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </AnimatedG>
    </Svg>
  );
}

export { GraduationCapIcon };
export type { GraduationCapIconHandle };
