// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import {
  transformProps,
  useIconMotion,
  type AnimatedIconProps,
  type IconTiming,
  type IconHandle,
} from '../lib/icon-motion';

/** The handle a control starts and stops {@link ArrowUpIcon} through. */
type ArrowUpIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** How long each way of the motion runs, in ms: half the web icon's. */
const TIMING: IconTiming = { duration: 200 };

/**
 * Lucide's arrow-up icon, whose head dips and whose stem shortens from the top, then both return, when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function ArrowUpIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const head = useAnimatedProps(() => transformProps({ y: 3 * progress.value }));
  const stem = useAnimatedProps(() => ({ d: `M12 19V${5 + 5 * progress.value}` }));

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
      <AnimatedPath d="m5 12 7-7 7 7" animatedProps={head} />
      <AnimatedPath d="M12 19V5" animatedProps={stem} />
    </Svg>
  );
}

export { ArrowUpIcon };
export type { ArrowUpIconHandle };
