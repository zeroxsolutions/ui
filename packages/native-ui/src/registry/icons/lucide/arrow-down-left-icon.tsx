// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowDownLeftIcon} through. */
type ArrowDownLeftIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's arrow-down-left icon, whose head and the near half of its shaft pull back up and right, the shaft
 * shrinking, then return, when started. Hidden from a screen reader: the control around it says what it does.
 */
function ArrowDownLeftIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const head = useAnimatedProps(() => transformProps({ x: 3 * progress.value, y: -3 * progress.value }));
  const shaft = useAnimatedProps(() => {
    const scale = 1 - 0.15 * progress.value;
    return transformProps({ x: 3 * progress.value, y: -3 * progress.value, scaleX: scale, scaleY: scale, originY: 17 });
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
      <AnimatedPath d="M17 17H7V7" animatedProps={head} />
      <AnimatedPath d="M7 17L12 12" animatedProps={shaft} />
      <Path d="M17 7L12 12" />
    </Svg>
  );
}

export { ArrowDownLeftIcon };
export type { ArrowDownLeftIconHandle };
