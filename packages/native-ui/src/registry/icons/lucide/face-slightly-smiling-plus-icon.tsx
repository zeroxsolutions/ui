// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FaceSlightlySmilingPlusIcon} through. */
type FaceSlightlySmilingPlusIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** The face's scale at the far end: less than the web twin's 1.1, which would take the plus past the canvas. */
const SWELL = 1.05;

/**
 * Lucide's face-slightly-smiling-plus icon, which swells a little while its plus turns a quarter turn and grows when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function FaceSlightlySmilingPlusIcon({
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
    const scale = 1 + (SWELL - 1) * progress.value;
    return transformProps({ scaleX: scale, scaleY: scale });
  });
  const plus = useAnimatedProps(() => {
    const turn = interpolate(progress.value, [0.1, 1], [0, 1], Extrapolation.CLAMP);
    return transformProps({
      rotate: 90 * turn,
      scaleX: 1 + 0.1 * turn,
      scaleY: 1 + 0.1 * turn,
      originX: 19,
      originY: 5,
    });
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
      <AnimatedG animatedProps={face}>
        <Path d="M13.267 2.08a10 10 0 108.653 8.653" />
        <Path d="M16.472 15a6 6 0 01-8.943 0" />
        <Path d="M9 10V9" />
        <Path d="M15 10V9" />
        <AnimatedG animatedProps={plus}>
          <Path d="M16 5h6" />
          <Path d="M19 2v6" />
        </AnimatedG>
      </AnimatedG>
    </Svg>
  );
}

export { FaceSlightlySmilingPlusIcon };
export type { FaceSlightlySmilingPlusIconHandle };
