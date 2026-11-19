// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FaceExpressionlessIcon} through. */
type FaceExpressionlessIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** The brow whose middle sits at `cx`, lifting, tilting and moving `side` units outwards as `lift` runs to 1. */
function brow(lift: number, cx: number, side: number): IconTransformProps {
  'worklet';
  return transformProps({ x: side * lift, y: -lift, rotate: 15 * lift, originX: cx, originY: 10 });
}

/**
 * Lucide's face-expressionless icon, which swells a little while its mouth narrows and drops and its brows lift and
 * tilt when started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceExpressionlessIcon({
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
    const scale = 1 + 0.05 * progress.value;
    return transformProps({ scaleX: scale, scaleY: scale });
  });
  const mouth = useAnimatedProps(() =>
    transformProps({ y: progress.value, scaleX: 1 - 0.2 * progress.value, originY: 16 }),
  );
  const leftBrow = useAnimatedProps(() => brow(progress.value, 9, -0.5));
  const rightBrow = useAnimatedProps(() =>
    brow(interpolate(progress.value, [0.1, 1], [0, 1], Extrapolation.CLAMP), 15, 0.5),
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
      <AnimatedG animatedProps={face}>
        <Circle cx="12" cy="12" r="10" />
        <AnimatedPath d="M8 16h8" animatedProps={mouth} />
        <AnimatedPath d="M8 10h2" animatedProps={leftBrow} />
        <AnimatedPath d="M14 10h2" animatedProps={rightBrow} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceExpressionlessIcon };
export type { FaceExpressionlessIconHandle };
