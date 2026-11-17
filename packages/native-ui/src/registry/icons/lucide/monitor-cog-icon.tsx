// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link MonitorCogIcon} through. */
type MonitorCogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's monitor-cog icon, whose cog turns half a turn and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function MonitorCogIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cog = useAnimatedProps(() => transformProps({ rotate: 180 * progress.value, originX: 18, originY: 6 }));

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
      <Path d="M12 17v4" />
      <Path d="M22 13v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
      <Path d="M8 21h8" />
      <AnimatedG animatedProps={cog}>
        <Path d="m14.305 7.53.923-.382" />
        <Path d="m15.228 4.852-.923-.383" />
        <Path d="m16.852 3.228-.383-.924" />
        <Path d="m16.852 8.772-.383.923" />
        <Path d="m19.148 3.228.383-.924" />
        <Path d="m19.53 9.696-.382-.924" />
        <Path d="m20.772 4.852.924-.383" />
        <Path d="m20.772 7.148.924.383" />
        <Circle cx="18" cy="6" r="3" />
      </AnimatedG>
    </Svg>
  );
}

export { MonitorCogIcon };
export type { MonitorCogIconHandle };
