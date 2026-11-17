// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  dash,
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTransformProps,
  type IconHandle,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FaceSlightlySmilingIcon} through. */
type FaceSlightlySmilingIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The eye whose middle sits at `cx`, popping wider and narrower. */
function eye(progress: number, cx: number): IconTransformProps {
  'worklet';
  const scale = interpolate(progress, [0, 0.3, 0.6, 1], [1, 1.5, 0.8, 1.2]);
  return transformProps({ scaleX: scale, scaleY: scale, originX: cx, originY: 9.5 });
}

/**
 * Lucide's face slightly smiling icon, which bounces and tilts while its smile is drawn again as it widens to the web
 * twin's `M17.5 14.5a6 6 0 0 1-11 0` and its eyes pop, then settles, when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function FaceSlightlySmilingIcon({
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
  // A swell of 1.08, 1.03 and 1.06, less than the web twin's 1.15, 1.05 and 1.1, which take the face past the canvas,
  // which react-native-svg clips.
  const face = useAnimatedProps(() => {
    const scale = interpolate(progress.value, [0, 0.3, 0.6, 1], [1, 1.08, 1.03, 1.06]);
    return {
      ...transformProps({
        scaleX: scale,
        scaleY: scale,
        rotate: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, -3, 3, 0]),
      }),
      strokeWidth: width * (1 + 0.25 * progress.value),
    };
  });
  const mouth = useAnimatedProps(() => {
    const widen = interpolate(progress.value, [0.125, 0.625], [0, 1], Extrapolation.CLAMP);
    const chord = 8.943 + 2.057 * widen;
    return {
      d: `M${16.472 + 1.028 * widen} ${15 - 0.5 * widen}a6 6 0 0 1-${chord} 0`,
      ...dash(12 * Math.asin(chord / 12), interpolate(progress.value, [0, 0.125, 0.4375], [1, 0.3, 1])),
    };
  });
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
        <AnimatedPath d="M16.472 15a6 6 0 01-8.943 0" animatedProps={mouth} />
        <AnimatedPath d="M9 10V9" animatedProps={leftEye} />
        <AnimatedPath d="M15 10V9" animatedProps={rightEye} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceSlightlySmilingIcon };
export type { FaceSlightlySmilingIconHandle };
