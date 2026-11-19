// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudCogIcon} through. */
type CloudCogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's cloud-cog icon, whose cog turns half a turn about its middle and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function CloudCogIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cog = useAnimatedProps(() => transformProps({ rotate: 180 * progress.value, originY: 17 }));

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
      <Path d="M4.2 15.1a7 7 0 1 1 9.93-9.858A7 7 0 0 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.2" />
      <AnimatedG animatedProps={cog}>
        <Path d="m10.852 19.772-.383.924" />
        <Path d="m13.148 14.228.383-.923" />
        <Path d="M13.148 19.772a3 3 0 1 0-2.296-5.544l-.383-.923" />
        <Path d="m13.53 20.696-.382-.924a3 3 0 1 1-2.296-5.544" />
        <Path d="m14.772 15.852.923-.383" />
        <Path d="m14.772 18.148.923.383" />
        <Path d="m9.228 15.852-.923-.383" />
        <Path d="m9.228 18.148-.923.383" />
      </AnimatedG>
    </Svg>
  );
}

export { CloudCogIcon };
export type { CloudCogIconHandle };
