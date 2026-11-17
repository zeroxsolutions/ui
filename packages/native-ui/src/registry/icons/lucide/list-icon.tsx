// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link ListIcon} through. */
type ListIconHandle = IconHandle;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's list icon, whose bullets fade out and back and whose lines shorten, one after another, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function ListIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const firstBullet = useAnimatedProps(() => {
    const p = progress.value;
    return { opacity: 1 - p };
  });
  const secondBullet = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { opacity: 1 - p };
  });
  const thirdBullet = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { opacity: 1 - p };
  });
  const firstLine = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 - 0.3 * p, originX: 8, originY: 5 }) };
  });
  const secondLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.08) / 0.92);
    return { ...transformProps({ scaleX: 1 - 0.3 * p, originX: 8 }) };
  });
  const thirdLine = useAnimatedProps(() => {
    const p = Math.max(0, (progress.value - 0.16) / 0.84);
    return { ...transformProps({ scaleX: 1 - 0.3 * p, originX: 8, originY: 19 }) };
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
      {...props}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AnimatedPath d="M3 5h.01" animatedProps={firstBullet} />
      <AnimatedPath d="M3 12h.01" animatedProps={secondBullet} />
      <AnimatedPath d="M3 19h.01" animatedProps={thirdBullet} />
      <AnimatedPath d="M8 5h13" animatedProps={firstLine} />
      <AnimatedPath d="M8 12h13" animatedProps={secondLine} />
      <AnimatedPath d="M8 19h13" animatedProps={thirdLine} />
    </Svg>
  );
}

export { ListIcon };
export type { ListIconHandle };
