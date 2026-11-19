// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link PhoneMissedIcon} through. */
type PhoneMissedIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How much the cross grows about its middle, and the phone about the middle: the web twin's. */
const CROSS = 1.2;
const SWELL = 1.05;

/**
 * Lucide's phone-missed icon, whose cross grows while the phone swells, and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function PhoneMissedIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cross = useAnimatedProps(() => {
    const size = 1 + (CROSS - 1) * progress.value;
    return transformProps({ scaleX: size, scaleY: size, originX: 19, originY: 5 });
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
      <AnimatedG animatedProps={cross}>
        <Path d="m16 2 6 6" />
        <Path d="m22 2-6 6" />
      </AnimatedG>
      <AnimatedPath
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        animatedProps={phone}
      />
    </Svg>
  );
}

export { PhoneMissedIcon };
export type { PhoneMissedIconHandle };
