// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link InfoIcon} through. */
type InfoIconHandle = IconHandle;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Lucide's info icon, whose ring swells, whose stem shortens and whose dot lifts, then all return, when
 * started. Hidden from a screen reader: the control around it says what it does.
 */
function InfoIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const ring = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleX: 1 + 0.08 * p, scaleY: 1 + 0.08 * p }) };
  });
  const stem = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ scaleY: 1 - 0.4 * p, originY: 16 }) };
  });
  const dot = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ y: -2.5 * p }) };
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
      <AnimatedCircle cx="12" cy="12" r="10" animatedProps={ring} />
      <AnimatedPath d="M12 16v-4" animatedProps={stem} />
      <AnimatedPath d="M12 8h.01" animatedProps={dot} />
    </Svg>
  );
}

export { InfoIcon };
export type { InfoIconHandle };
