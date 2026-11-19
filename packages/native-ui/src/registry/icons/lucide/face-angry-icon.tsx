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

/** The handle a control starts and stops {@link FaceAngryIcon} through. */
type FaceAngryIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far each brow turns, in degrees. */
const BROW = 20;

/** The face's largest scale: less than the web twin's 1.2, which would take it past the canvas. */
const SWELL = 1.08;

/** The eye whose middle sits at `cx`, widening. */
function eye(progress: number, cx: number): IconTransformProps {
  'worklet';
  const scale = 1 + 0.2 * progress;
  return transformProps({ scaleX: scale, scaleY: scale, originX: cx, originY: 11.208 });
}

/**
 * Lucide's face-angry icon, which swells and shakes while its brows knit, its eyes widen and its mouth tightens when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceAngryIcon({
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
    const scale = interpolate(progress.value, [0, 1 / 3, 1], [1, SWELL, SWELL]);
    return transformProps({
      scaleX: scale,
      scaleY: scale,
      rotate: interpolate(progress.value, [0, 1 / 3, 2 / 3, 1], [0, -3, 3, -1]),
    });
  });
  const mouth = useAnimatedProps(() => transformProps({ y: -0.5 * progress.value }));
  const leftBrow = useAnimatedProps(() =>
    transformProps({ rotate: BROW * progress.value, originX: 8.5, originY: 10.5 }),
  );
  const rightBrow = useAnimatedProps(() =>
    transformProps({ rotate: -BROW * progress.value, originX: 15.5, originY: 10.5 }),
  );
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
      <AnimatedG animatedProps={face}>
        <Circle cx="12" cy="12" r="10" />
        <AnimatedPath d="M9 17a5 5 0 016.001 0" animatedProps={mouth} />
        <AnimatedPath d="M7 10a5 5 0 013 1" animatedProps={leftBrow} />
        <AnimatedPath d="M17 10a5 5 0 00-3 1" animatedProps={rightBrow} />
        <AnimatedPath d="M9 12v-1.584" animatedProps={leftEye} />
        <AnimatedPath d="M15 12v-1.584" animatedProps={rightEye} />
      </AnimatedG>
    </Svg>
  );
}

export { FaceAngryIcon };
export type { FaceAngryIconHandle };
