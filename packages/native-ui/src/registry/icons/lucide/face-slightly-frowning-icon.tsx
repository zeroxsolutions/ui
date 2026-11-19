// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FaceSlightlyFrowningIcon} through. */
type FaceSlightlyFrowningIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the frown at its deepest, in the 24-unit viewBox. */
const FROWN = 6.78;

/** The eye whose middle sits at `cx`, popping through `scales` as it lifts and drops. */
function eye(progress: number, cx: number, scales: number[]): IconTransformProps {
  'worklet';
  const scale = interpolate(progress, [0, 0.3, 0.6, 1], scales);
  return transformProps({
    y: interpolate(progress, [0, 0.3, 0.6, 1], [0, -0.5, 0.3, 0]),
    scaleX: scale,
    scaleY: scale,
    originX: cx,
    originY: 9.5,
  });
}

/**
 * Lucide's face-slightly-frowning icon, which swells and sways while its frown deepens and its eyes pop out of step
 * when started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceSlightlyFrowningIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const face = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 0.3, 0.6, 1], [1, 1.09, 1.05, 1.08]);
    return transformProps({
      scaleX: scale,
      scaleY: scale,
      rotate: interpolate(progress.value, [0, 0.3, 0.6, 1], [0, -2, 2, 0]),
    });
  });
  const frown = useAnimatedProps(() => {
    const deep = progress.value;
    return {
      d: `M9 ${16 + deep}a${5 - deep} ${5 - deep} 0 0 1 6 0`,
      ...dash(FROWN, interpolate(deep, [0, 0.25, 0.5], [1, 0.3, 1], Extrapolation.CLAMP)),
    };
  });
  const leftEye = useAnimatedProps(() => eye(progress.value, 9, [1, 1.3, 0.9, 1.1]));
  const rightEye = useAnimatedProps(() => eye(progress.value, 15, [1, 0.9, 1.3, 1.1]));

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
      <AnimatedG animatedProps={face}>
        <Circle cx="12" cy="12" r="10" />
        <AnimatedPath d="M9 16a5 5 0 016 0" animatedProps={frown} />
        <AnimatedPath d="M9 10V9" animatedProps={leftEye} />
        <AnimatedPath d="M15 10V9" animatedProps={rightEye} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceSlightlyFrowningIcon };
export type { FaceSlightlyFrowningIconHandle };
