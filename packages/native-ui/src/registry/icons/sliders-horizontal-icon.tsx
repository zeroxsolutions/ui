// Adapted from lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useIconMotion, type AnimatedIconProps, type IconHandle } from '../lib/icon-motion';

/** The handle a control starts and stops {@link SlidersHorizontalIcon} through. */
type SlidersHorizontalIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's sliders-horizontal icon, whose three knobs slide, each to its own side, and return when started.
 * Hidden from a screen reader: the control around it says what it does.
 */
function SlidersHorizontalIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const topLeft = useAnimatedProps(() => ({ d: `M${10 - 5 * progress.value} 5H3` }));
  const topRight = useAnimatedProps(() => ({ d: `M21 5H${14 - 5 * progress.value}` }));
  const topKnob = useAnimatedProps(() => ({ d: `M${14 - 5 * progress.value} 3v4` }));
  const middleLeft = useAnimatedProps(() => ({ d: `M${8 + 5 * progress.value} 12H3` }));
  const middleRight = useAnimatedProps(() => ({ d: `M21 12H${12 + 6 * progress.value}` }));
  const middleKnob = useAnimatedProps(() => ({ d: `M${8 + 5 * progress.value} 10v4` }));
  const bottomLeft = useAnimatedProps(() => ({ d: `M${12 - 8 * progress.value} 19H3` }));
  const bottomRight = useAnimatedProps(() => ({ d: `M21 19H${16 - 8 * progress.value}` }));
  const bottomKnob = useAnimatedProps(() => ({ d: `M${16 - 8 * progress.value} 17v4` }));

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
      <AnimatedPath d="M10 5H3" animatedProps={topLeft} />
      <AnimatedPath d="M21 5h-7" animatedProps={topRight} />
      <AnimatedPath d="M14 3v4" animatedProps={topKnob} />
      <AnimatedPath d="M8 12H3" animatedProps={middleLeft} />
      <AnimatedPath d="M21 12h-9" animatedProps={middleRight} />
      <AnimatedPath d="M8 10v4" animatedProps={middleKnob} />
      <AnimatedPath d="M12 19H3" animatedProps={bottomLeft} />
      <AnimatedPath d="M21 19h-5" animatedProps={bottomRight} />
      <AnimatedPath d="M16 17v4" animatedProps={bottomKnob} />
    </Svg>
  );
}

export { SlidersHorizontalIcon };
export type { SlidersHorizontalIconHandle };
