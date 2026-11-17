// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HatGlassesIcon} through. */
type HatGlassesIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * The hat's tip in degrees, and its lift in the 24-unit viewBox, at each half of the way out: less than the web
 * twin's -4 and -3, which would lift its crown past the top of the canvas, which react-native-svg clips.
 */
const TIP = [0, -3, 1.5];
const HAT_LIFT = [0, -1.2, 0.5];

/**
 * Lucide's hat-glasses icon, whose hat tips up and settles while its glasses dip, and back when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function HatGlassesIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const hat = useAnimatedProps(() =>
    transformProps({
      rotate: interpolate(progress.value, [0, 0.5, 1], TIP),
      y: interpolate(progress.value, [0, 0.5, 1], HAT_LIFT),
      originX: 12,
      originY: 11,
    }),
  );
  const glasses = useAnimatedProps(() => {
    const dip = interpolate(progress.value, [0.5, 1], [0, 1], Extrapolation.CLAMP);
    return transformProps({ y: dip, scaleX: 1 - 0.04 * dip, scaleY: 1 - 0.04 * dip, originX: 12, originY: 18 });
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
      <AnimatedG animatedProps={hat}>
        <Path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />
        <Path d="M2 11h20" />
      </AnimatedG>
      <AnimatedG animatedProps={glasses}>
        <Path d="M14 18a2 2 0 0 0-4 0" />
        <Circle cx="17" cy="18" r="3" />
        <Circle cx="7" cy="18" r="3" />
      </AnimatedG>
    </Svg>
  );
}

export { HatGlassesIcon };
export type { HatGlassesIconHandle };
