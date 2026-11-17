// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowUpRightIcon} through. */
type ArrowUpRightIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's arrow-up-right icon, which pulls back down and left, shrinking toward its tip, then returns, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ArrowUpRightIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const arrow = useAnimatedProps(() => {
    const scale = 1 - 0.15 * progress.value;
    return transformProps({
      x: -4 * progress.value,
      y: 4 * progress.value,
      scaleX: scale,
      scaleY: scale,
      originX: 17,
      originY: 7,
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
      <AnimatedG animatedProps={arrow}>
        <Path d="M7 7h10v10" />
        <Path d="M7 17 17 7" />
      </AnimatedG>
    </Svg>
  );
}

export { ArrowUpRightIcon };
export type { ArrowUpRightIconHandle };
