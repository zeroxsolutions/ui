// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowDownRightIcon} through. */
type ArrowDownRightIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's arrow-down-right icon, whose head and shaft pull back up and left, the shaft shrinking, then return, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ArrowDownRightIcon({
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
    const scale = 1 - 0.15 * progress.value;
    return transformProps({
      x: -3 * progress.value,
      y: -3 * progress.value,
      scaleX: scale,
      scaleY: scale,
      originX: 17,
      originY: 17,
    });
  });
  const head = useAnimatedProps(() => transformProps({ x: -3 * progress.value, y: -3 * progress.value }));
  const base = useAnimatedProps(() => transformProps({ x: -3 * progress.value, y: -3 * progress.value }));

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
      <AnimatedPath d="M7 7L17 17" animatedProps={shaft} />
      <AnimatedPath d="M17 7v10H7" animatedProps={head} />
      <AnimatedPath d="M17 17L10 17" animatedProps={base} />
    </Svg>
  );
}

export { ArrowDownRightIcon };
export type { ArrowDownRightIconHandle };
