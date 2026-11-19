// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link Disc3Icon} through. */
type Disc3IconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Half the web twin's 400 ms. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's disc-3 icon, whose grooves turn a quarter turn about its middle and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function Disc3Icon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const grooves = useAnimatedProps(() => transformProps({ rotate: 90 * progress.value }));

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
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="2" />
      <AnimatedG animatedProps={grooves}>
        <Path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
        <Path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
      </AnimatedG>
    </Svg>
  );
}

export { Disc3Icon };
export type { Disc3IconHandle };
