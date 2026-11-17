// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTransformProps,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link AlarmClockIcon} through. */
type AlarmClockIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The parts lifted `lift` units and shaken `sway` units to either side, twice each way of the motion.
 */
function shake(progress: number, lift: number, sway: number): IconTransformProps {
  'worklet';
  return transformProps({ x: sway * Math.sin(4 * Math.PI * progress), y: -lift * progress });
}

/**
 * Lucide's alarm-clock icon, which lifts and shakes side to side, its bells higher and wider than the rest, then
 * settles, when started. Hidden from a screen reader: the control around it says what it does.
 */
function AlarmClockIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const clock = useAnimatedProps(() => shake(progress.value, 1.5, 1));
  const bells = useAnimatedProps(() => shake(progress.value, 2.5, 2));

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
      <AnimatedG animatedProps={clock}>
        <Circle cx="12" cy="13" r="8" />
        <Path d="M12 9v4l2 2" />
        <Path d="M6.38 18.7 4 21" />
        <Path d="M17.64 18.67 20 21" />
      </AnimatedG>
      <AnimatedG animatedProps={bells}>
        <Path d="M5 3 2 6" />
        <Path d="m22 6-3-3" />
      </AnimatedG>
    </Svg>
  );
}

export { AlarmClockIcon };
export type { AlarmClockIconHandle };
