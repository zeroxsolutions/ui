// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link DumbbellIcon} through. */
type DumbbellIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's dumbbell icon, whose weights wobble to one side and the other, when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function DumbbellIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // 9.5 degrees, less than the web twin's 12, which takes a weight's end past the canvas, which react-native-svg clips.
  const weights = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ rotate: -9.5 * Math.sin(2 * Math.PI * p) }) };
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
      <AnimatedG animatedProps={weights}>
        <Path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
        <Path d="m2.5 21.5 1.4-1.4" />
        <Path d="m20.1 3.9 1.4-1.4" />
        <Path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
        <Path d="m9.6 14.4 4.8-4.8" />
      </AnimatedG>
    </Svg>
  );
}

export { DumbbellIcon };
export type { DumbbellIconHandle };
