// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CogIcon} through. */
type CogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's cog icon, which turns half a turn about its middle and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function CogIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cog = useAnimatedProps(() => transformProps({ rotate: 180 * progress.value }));

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
      <AnimatedG animatedProps={cog}>
        <Circle cx="12" cy="12" r="8" />
        <Circle cx="12" cy="12" r="2" />
        <Path d="M12 2v2" />
        <Path d="M12 22v-2" />
        <Path d="m17 20.66-1-1.73" />
        <Path d="M11 10.27 7 3.34" />
        <Path d="m20.66 17-1.73-1" />
        <Path d="m3.34 7 1.73 1" />
        <Path d="M14 12h8" />
        <Path d="M2 12h2" />
        <Path d="m20.66 7-1.73 1" />
        <Path d="m3.34 17 1.73-1" />
        <Path d="m17 3.34-1 1.73" />
        <Path d="m11 13.73-4 6.93" />
      </AnimatedG>
    </Svg>
  );
}

export { CogIcon };
export type { CogIconHandle };
