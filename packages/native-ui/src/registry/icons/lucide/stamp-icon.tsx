// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link StampIcon} through. */
type StampIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the stamp presses down: the web twin's. */
const PRESS = 4;

/** How faint and how narrow the ink line gets about its middle (12, 22): the web twin's. */
const INK_DIM = 0.4;
const INK_WIDTH = 0.85;

/**
 * Lucide's stamp icon, which presses down, its ink dimming and narrowing, and lifts when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function StampIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const stamp = useAnimatedProps(() => transformProps({ y: PRESS * progress.value }));
  const ink = useAnimatedProps(() => ({
    ...transformProps({ scaleX: 1 - (1 - INK_WIDTH) * progress.value, originX: 12, originY: 22 }),
    opacity: 1 - (1 - INK_DIM) * progress.value,
  }));

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
      <AnimatedG animatedProps={stamp}>
        <Path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
        <Path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
      </AnimatedG>
      <AnimatedPath d="M5 22h14" animatedProps={ink} />
    </Svg>
  );
}

export { StampIcon };
export type { StampIconHandle };
