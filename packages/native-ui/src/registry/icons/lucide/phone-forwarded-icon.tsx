// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PhoneForwardedIcon} through. */
type PhoneForwardedIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the arrow shoots right, in the 24-unit viewBox: the web twin's. */
const SHOOT = 3;

/** How short the shaft gets about its head as it shoots: the web twin's. */
const SHAFT = 0.85;

/**
 * How much the phone and arrow shrink about the lower-left corner: the web twin grows them to 1.1, which with the
 * arrow's 3 would take its head past the canvas, which react-native-svg clips, so they shrink to give it the room.
 */
const SIZE = 0.88;

/**
 * Lucide's phone-forwarded icon, whose arrow shoots right while the phone draws back, and back when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function PhoneForwardedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const whole = useAnimatedProps(() => {
    const size = 1 - (1 - SIZE) * progress.value;
    return transformProps({ scaleX: size, scaleY: size, originX: 2, originY: 22 });
  });
  const shaft = useAnimatedProps(() => {
    const size = 1 - (1 - SHAFT) * progress.value;
    return transformProps({ x: SHOOT * progress.value, scaleX: size, scaleY: size, originX: 22, originY: 6 });
  });
  const head = useAnimatedProps(() => transformProps({ x: SHOOT * progress.value }));

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
      <AnimatedG animatedProps={whole}>
        <AnimatedPath d="M14 6h8" animatedProps={shaft} />
        <AnimatedPath d="m18 2 4 4-4 4" animatedProps={head} />
        <Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
      </AnimatedG>
    </Svg>
  );
}

export { PhoneForwardedIcon };
export type { PhoneForwardedIconHandle };
