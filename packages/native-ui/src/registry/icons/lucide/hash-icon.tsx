// Motion authored for this registry in the manner of lucide-animated (https://github.com/pqoqubbw/icons), MIT License, Copyright (c) 2024-2026 pqoqubbw.

import type { ReactNode } from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, { G, Line } from 'react-native-svg';
import { transformProps, useIconMotion, type AnimatedIconProps, type IconHandle } from '../../lib/icon-motion';

/** The handle a control starts and stops {@link HashIcon} through. */
type HashIconHandle = IconHandle;

const AnimatedG = Animated.createAnimatedComponent(G);

/**
 * Lucide's hash icon, whose two bars slide in opposite directions and return, when started. Hidden from a
 * screen reader: the control around it says what it does.
 */
function HashIcon({
  ref,
  color = 'currentColor',
  size = 24,
  strokeWidth = 2,
  absoluteStrokeWidth: _absoluteStrokeWidth,
  nonScalingStroke: _nonScalingStroke,
  ...props
}: AnimatedIconProps): ReactNode {
  const progress = useIconMotion(ref);
  const upper = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: 2 * p }) };
  });
  const lower = useAnimatedProps(() => {
    const p = progress.value;
    return { ...transformProps({ x: -2 * p }) };
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
      <AnimatedG animatedProps={upper}>
        <Line x1="4" x2="20" y1="9" y2="9" />
      </AnimatedG>
      <AnimatedG animatedProps={lower}>
        <Line x1="4" x2="20" y1="15" y2="15" />
      </AnimatedG>
      <Line x1="10" x2="8" y1="3" y2="21" />
      <Line x1="16" x2="14" y1="3" y2="21" />
    </Svg>
  );
}

export { HashIcon };
export type { HashIconHandle };
