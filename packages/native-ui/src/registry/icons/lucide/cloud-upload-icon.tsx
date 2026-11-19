// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconHandle,
  type IconTiming,
} from '../../lib/icon-motion';

/** The handle a control starts and stops {@link CloudUploadIcon} through. */
type CloudUploadIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/** Half the web twin's 300 ms. */
const TIMING: IconTiming = { duration: 150 };

/**
 * Lucide's cloud-upload icon, whose arrow rises and comes back down when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function CloudUploadIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const arrow = useAnimatedProps(() => transformProps({ y: -2 * progress.value }));

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
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <AnimatedG animatedProps={arrow}>
        <Path d="M12 13v8" />
        <Path d="m8 17 4-4 4 4" />
      </AnimatedG>
    </Svg>
  );
}

export { CloudUploadIcon };
export type { CloudUploadIconHandle };
