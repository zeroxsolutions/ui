// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link WavesArrowDownIcon} through. */
type WavesArrowDownIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How far the arrow dips, and how short its shaft gets about its foot (12, 10): the web twin's. */
const DIP = 3;
const SHAFT = 0.85;

/**
 * Lucide's waves-arrow-down icon, whose arrow dips into the waves, its shaft shortening, and back when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function WavesArrowDownIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const shaft = useAnimatedProps(() => {
    const size = 1 - (1 - SHAFT) * progress.value;
    return transformProps({ y: DIP * progress.value, scaleX: size, scaleY: size, originX: 12, originY: 10 });
  });
  const head = useAnimatedProps(() => transformProps({ y: DIP * progress.value }));

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
      <AnimatedPath d="M12 10L12 2" animatedProps={shaft} />
      <AnimatedPath d="M16 6L12 10L8 6" animatedProps={head} />
      <Path d="M2 15C2.6 15.5 3.2 16 4.5 16C7 16 7 14 9.5 14C12.1 14 11.9 16 14.5 16C17 16 17 14 19.5 14C20.8 14 21.4 14.5 22 15" />
      <Path d="M2 21C2.6 21.5 3.2 22 4.5 22C7 22 7 20 9.5 20C12.1 20 11.9 22 14.5 22C17 22 17 20 19.5 20C20.8 20 21.4 20.5 22 21" />
    </Svg>
  );
}

export { WavesArrowDownIcon };
export type { WavesArrowDownIconHandle };
