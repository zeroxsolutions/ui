// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PhoneIncomingIcon} through. */
type PhoneIncomingIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How much the arrow grows about its middle, and how far it moves in towards the phone: the web twin's. */
const ARROW = 1.2;
const IN = 1;

/**
 * How much the phone swells about the middle: a little less than the web twin's 1.1, which would push the handset
 * past the canvas, which react-native-svg clips.
 */
const SWELL = 1.08;

/**
 * Lucide's phone-incoming icon, whose arrow grows towards the phone while the phone swells, and back when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function PhoneIncomingIcon({
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
    const size = 1 + (ARROW - 1) * progress.value;
    return transformProps({
      x: -IN * progress.value,
      y: IN * progress.value,
      scaleX: size,
      scaleY: size,
      originX: 19,
      originY: 5,
    });
  });
  const phone = useAnimatedProps(() => {
    const size = 1 + (SWELL - 1) * progress.value;
    return transformProps({ scaleX: size, scaleY: size });
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
        <Path d="M16 2v6h6" />
        <Path d="m22 2-6 6" />
      </AnimatedG>
      <AnimatedPath
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        animatedProps={phone}
      />
    </Svg>
  );
}

export { PhoneIncomingIcon };
export type { PhoneIncomingIconHandle };
