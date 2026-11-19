// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FileCogIcon} through. */
type FileCogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's file-cog icon, whose cog turns half a turn about its middle and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function FileCogIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cog = useAnimatedProps(() => transformProps({ rotate: 180 * progress.value, originX: 7, originY: 18 }));

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
      <Path d="M15 8a1 1 0 0 1-1-1V2a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8z" />
      <Path d="M20 8v12a2 2 0 0 1-2 2h-4.182" />
      <Path d="M4 10.592V4a2 2 0 0 1 2-2h8" />
      <AnimatedG animatedProps={cog}>
        <Path d="m3.305 19.53.923-.382" />
        <Path d="m4.228 16.852-.924-.383" />
        <Path d="m5.852 15.228-.383-.923" />
        <Path d="m5.852 20.772-.383.924" />
        <Path d="m8.148 15.228.383-.923" />
        <Path d="m8.53 21.696-.382-.924" />
        <Path d="m9.773 16.852.922-.383" />
        <Path d="m9.773 19.148.922.383" />
        <Circle cx="7" cy="18" r="3" />
      </AnimatedG>
    </Svg>
  );
}

export { FileCogIcon };
export type { FileCogIconHandle };
