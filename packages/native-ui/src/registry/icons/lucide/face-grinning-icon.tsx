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

/** The handle a control starts and stops {@link FaceGrinningIcon} through. */
type FaceGrinningIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The length of the grin, in the 24-unit viewBox. */
const GRIN = 23.44;

/** The eye whose middle sits at `cx`, popping wider and narrower. */
function eye(progress: number, cx: number): IconTransformProps {
  'worklet';
  const scale = interpolate(progress, [0, 0.3, 0.6, 1], [1, 1.3, 1, 1.7]);
  return transformProps({ scaleX: scale, scaleY: scale, originX: cx, originY: 9.5 });
}

/**
 * Lucide's face-grinning icon, which bounces and tilts with a bolder line while its grin widens and its eyes pop when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceGrinningIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const width = Number.parseFloat(String(strokeWidth));
  const face = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [1, 1.07, 1, 1.05]);
    return {
      ...transformProps({
        scaleX: scale,
        scaleY: scale,
        rotate: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, 3, -2, 3]),
      }),
      strokeWidth: width * interpolate(progress.value, [0, 0.25], [1, 1.25], Extrapolation.CLAMP),
    };
  });
  const grin = useAnimatedProps(() => ({
    ...dash(GRIN, interpolate(progress.value, [0, 0.25, 0.5], [1, 0.7, 1], Extrapolation.CLAMP)),
    ...transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 0.3]),
      scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 1.2, 1.1]),
      originY: 16,
    }),
  }));
  const leftEye = useAnimatedProps(() => eye(progress.value, 9));
  const rightEye = useAnimatedProps(() => eye(progress.value, 15));

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
      <AnimatedG strokeWidth={strokeWidth} animatedProps={face}>
        <Circle cx="12" cy="12" r="10" />
        <AnimatedPath
          d="M7.084 14.302a5.12 5.12 0 009.833 0 .24.24 0 00-.235-.302H7.32a.24.24 0 00-.235.302"
          animatedProps={grin}
        />
        <AnimatedPath d="M9 10V9" animatedProps={leftEye} />
        <AnimatedPath d="M15 10V9" animatedProps={rightEye} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceGrinningIcon };
export type { FaceGrinningIconHandle };
