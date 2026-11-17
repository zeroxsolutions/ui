// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link LoaderIcon} through. */
type LoaderIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's loader icon, whose spokes turn a full turn about the middle and unwind when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function LoaderIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const spokes = useAnimatedProps(() => transformProps({ rotate: 360 * progress.value }));

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
      <AnimatedG animatedProps={spokes}>
        <Path d="M12 2v4" />
        <Path d="m16.2 7.8 2.9-2.9" />
        <Path d="M18 12h4" />
        <Path d="m16.2 16.2 2.9 2.9" />
        <Path d="M12 18v4" />
        <Path d="m4.9 19.1 2.9-2.9" />
        <Path d="M2 12h4" />
        <Path d="m4.9 4.9 2.9 2.9" />
      </AnimatedG>
    </Svg>
  );
}

export { LoaderIcon };
export type { LoaderIconHandle };
