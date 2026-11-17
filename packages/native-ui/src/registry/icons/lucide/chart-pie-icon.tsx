// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ChartPieIcon} through. */
type ChartPieIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's chart-pie icon, whose slice moves out from the pie, up and right, and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function ChartPieIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  // Less than the web twin's 1.1, which takes the slice past the canvas, which react-native-svg clips.
  const slice = useAnimatedProps(() => transformProps({ x: progress.value, y: -progress.value }));

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
      <AnimatedPath
        d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"
        animatedProps={slice}
      />
      <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    </Svg>
  );
}

export { ChartPieIcon };
export type { ChartPieIconHandle };
