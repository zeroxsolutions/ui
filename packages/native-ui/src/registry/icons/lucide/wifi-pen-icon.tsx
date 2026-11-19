// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WifiPenIcon} through. */
type WifiPenIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Where the pen is at each half of the way out: the web twin's first keyframes. Its turn of under half a degree is
 * left out.
 */
const SCRIBBLE_X = [0, -0.5, 1];
const SCRIBBLE_Y = [0, 1, -0.5];

/**
 * Lucide's wifi-pen icon, whose pen scribbles to and fro, and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function WifiPenIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const pen = useAnimatedProps(() =>
    transformProps({
      x: interpolate(progress.value, [0, 0.5, 1], SCRIBBLE_X),
      y: interpolate(progress.value, [0, 0.5, 1], SCRIBBLE_Y),
    }),
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
      <Path d="M2 8.82a15 15 0 0 1 20 0" />
      <AnimatedPath
        d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
        animatedProps={pen}
      />
      <Path d="M5 12.859a10 10 0 0 1 10.5-2.222" />
      <Path d="M8.5 16.429a5 5 0 0 1 3-1.406" />
    </Svg>
  );
}

export { WifiPenIcon };
export type { WifiPenIconHandle };
