// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ServerCogIcon} through. */
type ServerCogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's server-cog icon, whose cog turns half a turn and back when started. Hidden from a screen reader: the control
 * around it says what it does.
 */
function ServerCogIcon({
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
        <Path d="m10.852 14.772-.383.923" />
        <Path d="M13.148 14.772a3 3 0 1 0-2.296-5.544l-.383-.923" />
        <Path d="m13.148 9.228.383-.923" />
        <Path d="m13.53 15.696-.382-.924a3 3 0 1 1-2.296-5.544" />
        <Path d="m14.772 10.852.923-.383" />
        <Path d="m14.772 13.148.923.383" />
        <Path d="m9.228 10.852-.923-.383" />
        <Path d="m9.228 13.148-.923.383" />
      </AnimatedG>
      <Path d="M4.5 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-.5" />
      <Path d="M4.5 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-.5" />
      <Path d="M6 18h.01" />
      <Path d="M6 6h.01" />
    </Svg>
  );
}

export { ServerCogIcon };
export type { ServerCogIconHandle };
