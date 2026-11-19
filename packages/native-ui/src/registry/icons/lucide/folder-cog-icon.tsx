// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link FolderCogIcon} through. */
type FolderCogIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's folder-cog icon, whose cog turns half a turn about its middle and back when started. Hidden from a screen
 * reader: the control around it says what it does.
 */
function FolderCogIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const cog = useAnimatedProps(() => transformProps({ rotate: 180 * progress.value, originX: 18, originY: 18 }));

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
      <Path d="M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3" />
      <AnimatedG animatedProps={cog}>
        <Path d="m14.305 19.53.923-.382" />
        <Path d="m15.228 16.852-.923-.383" />
        <Path d="m16.852 15.228-.383-.923" />
        <Path d="m16.852 20.772-.383.924" />
        <Path d="m19.148 15.228.383-.923" />
        <Path d="m19.53 21.696-.382-.924" />
        <Path d="m20.772 16.852.924-.383" />
        <Path d="m20.772 19.148.924.383" />
        <Circle cx="18" cy="18" r="3" />
      </AnimatedG>
    </Svg>
  );
}

export { FolderCogIcon };
export type { FolderCogIconHandle };
