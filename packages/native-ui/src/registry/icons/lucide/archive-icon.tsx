// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ArchiveIcon} through. */
type ArchiveIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Lucide's archive icon, whose lid lifts while its box sinks and shortens and its handle drops, when started. Hidden
 * from a screen reader: the control around it says what it does.
 */
function ArchiveIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const lid = useAnimatedProps(() => transformProps({ y: -1.5 * progress.value }));
  const box = useAnimatedProps(() => {
    const top = 8 + 3 * progress.value;
    return { d: `M4 ${top}v${11 - 2 * progress.value}a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V${top}` };
  });
  const handle = useAnimatedProps(() => ({ d: `M10 ${12 + 3 * progress.value}h4` }));

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
      <AnimatedRect width="20" height="5" x="2" y="3" rx="1" animatedProps={lid} />
      <AnimatedPath d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" animatedProps={box} />
      <AnimatedPath d="M10 12h4" animatedProps={handle} />
    </Svg>
  );
}

export { ArchiveIcon };
export type { ArchiveIconHandle };
