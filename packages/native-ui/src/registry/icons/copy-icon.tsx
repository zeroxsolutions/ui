// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle, type IconTiming } from '../lib/icon-motion';

/** The handle a control starts and stops {@link CopyIcon} through. */
type CopyIconHandle = IconHandle;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const TIMING: IconTiming = { spring: { stiffness: 160, damping: 17, mass: 1 } };

/** How far the two sheets move apart, in the 24-unit viewBox: the front one up and left, the back one down and right. */
const SHIFT = 3;

/**
 * Lucide's copy icon, whose two sheets slide apart and back when started. Hidden from a screen reader: the
 * control around it says what it does.
 */
function CopyIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref, TIMING);
  const front = useAnimatedProps(() => ({
    x: 8 - SHIFT * progress.value,
    y: 8 - SHIFT * progress.value,
  }));
  const back = useAnimatedProps(() => {
    const offset = SHIFT * progress.value;
    return { d: `M${4 + offset} ${16 + offset}c-1.1 0-2-.9-2-2V${4 + offset}c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2` };
  });

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
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      {...props}
    >
      <AnimatedRect width="14" height="14" x="8" y="8" rx="2" ry="2" animatedProps={front} />
      <AnimatedPath d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" animatedProps={back} />
    </Svg>
  );
}

export { CopyIcon };
export type { CopyIconHandle };
