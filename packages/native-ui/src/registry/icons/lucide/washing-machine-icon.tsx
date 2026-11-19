// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WashingMachineIcon} through. */
type WashingMachineIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Where the machine and the drum are at each half of the way out: the web twin's first keyframes. */
const SHAKE = [0, 0.5, -0.5];
const BOB = [0, -0.3, 0.3];

/** How far the drum turns, in degrees about its middle (12, 13): the web twin's. */
const TURN = 360;

/**
 * Lucide's washing-machine icon, whose drum turns a full turn and bobs as the machine shakes, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function WashingMachineIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const machine = useAnimatedProps(() => transformProps({ x: interpolate(progress.value, [0, 0.5, 1], SHAKE) }));
  const drum = useAnimatedProps(() =>
    transformProps({
      y: interpolate(progress.value, [0, 0.5, 1], BOB),
      rotate: TURN * progress.value,
      originX: 12,
      originY: 13,
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
      <AnimatedG animatedProps={machine}>
        <Path d="M3 6h3" />
        <Path d="M17 6h.01" />
        <Rect width="18" height="20" x="3" y="2" rx="2" />
      </AnimatedG>
      <AnimatedG animatedProps={drum}>
        <Circle cx="12" cy="13" r="5" />
        <Path d="M12 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 1 0-5" />
      </AnimatedG>
    </Svg>
  );
}

export { WashingMachineIcon };
export type { WashingMachineIconHandle };
