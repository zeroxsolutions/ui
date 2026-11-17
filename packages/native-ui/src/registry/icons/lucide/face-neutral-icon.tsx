// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FaceNeutralIcon} through. */
type FaceNeutralIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The eye whose middle sits at `cx`, popping and glancing `side` units first. */
function eye(progress: number, cx: number, side: number): IconTransformProps {
  'worklet';
  const scale = interpolate(progress, [0, 0.3, 0.6, 1], [1, 1.3, 1, 1.2]);
  return transformProps({
    x: interpolate(progress, [0, 0.3, 0.6, 1], [0, side, -side, 0]),
    scaleX: scale,
    scaleY: scale,
    originX: cx,
    originY: 9.5,
  });
}

/**
 * Lucide's face-neutral icon, which bounces and tilts while its mouth stretches and its eyes pop and glance from side
 * to side when started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceNeutralIcon({
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
    const scale = interpolate(progress.value, [0, 0.4, 0.7, 1], [1, 1.05, 0.98, 1.02]);
    return transformProps({
      scaleX: scale,
      scaleY: scale,
      rotate: interpolate(progress.value, [0, 0.4, 0.7, 1], [0, 1, -1, 0]),
    });
  });
  const mouth = useAnimatedProps(() =>
    transformProps({
      y: interpolate(progress.value, [0, 0.3, 0.6, 1], [0, 0.5, -0.5, 0]),
      scaleX: interpolate(progress.value, [0, 0.3, 0.6, 1], [1, 1.2, 0.9, 1.1]),
      originY: 16,
    }),
  );
  const leftEye = useAnimatedProps(() => eye(progress.value, 9, -0.3));
  const rightEye = useAnimatedProps(() => eye(progress.value, 15, 0.3));

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
        <AnimatedPath d="M8 16h8" animatedProps={mouth} />
        <AnimatedPath d="M9 10V9" animatedProps={leftEye} />
        <AnimatedPath d="M15 10V9" animatedProps={rightEye} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceNeutralIcon };
export type { FaceNeutralIconHandle };
